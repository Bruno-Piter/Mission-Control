using MassTransit;
using Microsoft.EntityFrameworkCore;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Shared.Contracts;
using BillingWorker.Data;
using Microsoft.Extensions.Hosting;



var builder = Host.CreateApplicationBuilder(args);


// DbContext (SQLite) for idempotency
builder.Services.AddDbContext<BillingDbContext>(opt =>
    opt.UseSqlite("Data Source=billing.db"));

// OpenTelemetry
builder.Services.AddOpenTelemetry()
    .WithTracing(t => t
        .SetResourceBuilder(ResourceBuilder.CreateDefault().AddService("billing-worker"))
        .AddHttpClientInstrumentation()
        .AddSource("MassTransit")
        .AddZipkinExporter(o =>
        {
            o.Endpoint = new Uri(Environment.GetEnvironmentVariable("ZIPKIN_ENDPOINT") ?? "http://localhost:9411/api/v2/spans");
        })
    );

// MassTransit
builder.Services.AddMassTransit(bus =>
{
    bus.AddConsumer<OrderCreatedConsumer>();
    var transport = Environment.GetEnvironmentVariable("TRANSPORT") ?? "RABBITMQ";
    if (transport.Equals("RABBITMQ", StringComparison.OrdinalIgnoreCase))
    {
        bus.UsingRabbitMq((ctx, cfg) =>
        {
            var host = Environment.GetEnvironmentVariable("RABBITMQ__HOST") ?? "localhost";
            var username = Environment.GetEnvironmentVariable("RABBITMQ__USERNAME") ?? "guest";
            var password = Environment.GetEnvironmentVariable("RABBITMQ__PASSWORD") ?? "guest";
            cfg.Host(host, "/", h =>
            {
                h.Username(username);
                h.Password(password);
            });

            cfg.ReceiveEndpoint("billing-ordercreated", e =>
            {
                e.ConfigureConsumer<OrderCreatedConsumer>(ctx);
            });
        });
    }
    else
    {
        throw new NotSupportedException("Only RABBITMQ transport is wired in this starter.");
    }
});

var host = builder.Build();

// Ensure database
using (var scope = host.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<BillingDbContext>();
    db.Database.EnsureCreated();
}

await host.RunAsync();

public class OrderCreatedConsumer : IConsumer<OrderCreated>
{
    private readonly BillingDbContext _db;
    private readonly IPublishEndpoint _publisher;

    public OrderCreatedConsumer(BillingDbContext db, IPublishEndpoint publisher)
    {
        _db = db;
        _publisher = publisher;
    }

    public async Task Consume(ConsumeContext<OrderCreated> context)
    {
        var msg = context.Message;

        // Idempotency by OrderId
        var already = await _db.ProcessedOrders.FindAsync(msg.OrderId);
        if (already is not null)
        {
            Console.WriteLine($"[billing] Skipping duplicate OrderId={msg.OrderId}");
            return;
        }

        Console.WriteLine($"[billing] Processing OrderId={msg.OrderId} Amount={msg.Amount}");

        _db.ProcessedOrders.Add(new ProcessedOrder
        {
            OrderId = msg.OrderId,
            CustomerId = msg.CustomerId,
            Amount = msg.Amount,
            ProcessedAtUtc = DateTimeOffset.UtcNow
        });
        await _db.SaveChangesAsync();

        await _publisher.Publish(new BillingCompleted(
            OrderId: msg.OrderId,
            CustomerId: msg.CustomerId,
            Amount: msg.Amount,
            BilledAtUtc: DateTimeOffset.UtcNow,
            CorrelationId: msg.CorrelationId
        ));
    }
}
