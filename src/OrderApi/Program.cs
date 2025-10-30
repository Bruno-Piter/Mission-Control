using MassTransit;
using OpenTelemetry.Trace;
using OpenTelemetry.Resources;
using Shared.Contracts;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(opt =>
{
    opt.AddPolicy("dev", p => p
        .WithOrigins("http://localhost:5173")
        .AllowAnyHeader()
        .AllowAnyMethod());
});

// OpenTelemetry (Zipkin)
builder.Services.AddOpenTelemetry()
    .WithTracing(tracing => tracing
        .SetResourceBuilder(ResourceBuilder.CreateDefault().AddService("order-api"))
        .AddAspNetCoreInstrumentation()
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
        });
    }
    else
    {
        throw new NotSupportedException("Only RABBITMQ transport is wired in this starter.");
        // To add Azure Service Bus later:
        // bus.UsingAzureServiceBus((ctx, cfg) => { cfg.Host(Environment.GetEnvironmentVariable("AZURE_SB_CONNECTION")!); });
    }
});

var app = builder.Build();

app.UseCors("dev");

app.MapGet("/", () => Results.Ok(new { name = "Order API", status = "ok" }));

app.MapPost("/orders", async (OrderRequest req, IPublishEndpoint publisher) =>
{
    var correlationId = Guid.NewGuid().ToString("N");
    var evt = new OrderCreated(
        OrderId: req.OrderId ?? Guid.NewGuid().ToString("N"),
        CustomerId: req.CustomerId ?? "unknown",
        Amount: req.Amount,
        OccurredAtUtc: DateTimeOffset.UtcNow,
        CorrelationId: correlationId
    );

    await publisher.Publish(evt);
    return Results.Accepted($"/orders/{evt.OrderId}", new { evt.OrderId, evt.CorrelationId });
});

app.Run();

public record OrderRequest(string? OrderId, string CustomerId, decimal Amount);
