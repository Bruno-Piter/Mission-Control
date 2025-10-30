using MassTransit;
using Microsoft.Extensions.Hosting;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Shared.Contracts;

var builder = Host.CreateApplicationBuilder(args);



// OpenTelemetry
builder.Services.AddOpenTelemetry()
    .WithTracing(t => t
        .SetResourceBuilder(ResourceBuilder.CreateDefault().AddService("notifier-worker"))
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
    bus.AddConsumer<BillingCompletedConsumer>();
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

            cfg.ReceiveEndpoint("notifier-billingcompleted", e =>
            {
                e.ConfigureConsumer<BillingCompletedConsumer>(ctx);
            });
        });
    }
    else
    {
        throw new NotSupportedException("Only RABBITMQ transport is wired in this starter.");
    }
});

var host = builder.Build();
await host.RunAsync();

public class BillingCompletedConsumer : IConsumer<BillingCompleted>
{
    public Task Consume(ConsumeContext<BillingCompleted> context)
    {
        var m = context.Message;
        Console.WriteLine($"[notifier] Billing completed for Order={m.OrderId} Amount={m.Amount} Corr={m.CorrelationId}");
        return Task.CompletedTask;
    }
}
