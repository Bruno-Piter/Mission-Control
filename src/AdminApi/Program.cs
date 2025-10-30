using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using OpenTelemetry.Trace;
using OpenTelemetry.Resources;
using RabbitMQ.Client;

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
        .SetResourceBuilder(ResourceBuilder.CreateDefault().AddService("admin-api"))
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddZipkinExporter(o =>
        {
            o.Endpoint = new Uri(Environment.GetEnvironmentVariable("ZIPKIN_ENDPOINT") ?? "http://localhost:9411/api/v2/spans");
        })
    );

builder.Services.AddHttpClient("rabbitmq-mgmt", (sp, client) =>
{
    var mgmt = Environment.GetEnvironmentVariable("RABBITMQ__MGMTURI") ?? "http://localhost:15672";
    client.BaseAddress = new Uri(mgmt);
    // Basic auth
    var user = Environment.GetEnvironmentVariable("RABBITMQ__USERNAME") ?? "guest";
    var pass = Environment.GetEnvironmentVariable("RABBITMQ__PASSWORD") ?? "guest";
    var token = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{user}:{pass}"));
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", token);
});

var app = builder.Build();

app.UseCors("dev");


app.MapGet("/health", () => Results.Ok(new { service = "admin-api", status = "ok", now = DateTimeOffset.UtcNow }));

// List queues via RabbitMQ Management API
app.MapGet("/queues", async (IHttpClientFactory factory) =>
{
    var client = factory.CreateClient("rabbitmq-mgmt");
    // default vhost "/": url encoded is %2F
    var res = await client.GetAsync("/api/queues/%2F");
    if (!res.IsSuccessStatusCode)
    {
        return Results.Problem($"RabbitMQ management responded {res.StatusCode}", statusCode: (int)res.StatusCode);
    }
    var json = await res.Content.ReadAsStringAsync();
    using var doc = JsonDocument.Parse(json);
    var list = new List<object>();
    foreach (var q in doc.RootElement.EnumerateArray())
    {
        string name = q.GetProperty("name").GetString() ?? "";
        int messages = q.TryGetProperty("messages", out var m) ? m.GetInt32() : 0;
        int ready = q.TryGetProperty("messages_ready", out var mr) ? mr.GetInt32() : 0;
        int unacked = q.TryGetProperty("messages_unacknowledged", out var mu) ? mu.GetInt32() : 0;
        list.Add(new { name, messages, messages_ready = ready, messages_unacknowledged = unacked });
    }
    return Results.Ok(list);
});

// Replay messages from *_error to original queue
app.MapPost("/dlq/replay", (string queue, int? count) =>
{
    if (string.IsNullOrWhiteSpace(queue) || !queue.EndsWith("_error", StringComparison.OrdinalIgnoreCase))
        return Results.BadRequest(new { error = "Provide ?queue=<endpoint>_error" });

    var host = Environment.GetEnvironmentVariable("RABBITMQ__HOST") ?? "localhost";
    var user = Environment.GetEnvironmentVariable("RABBITMQ__USERNAME") ?? "guest";
    var pass = Environment.GetEnvironmentVariable("RABBITMQ__PASSWORD") ?? "guest";

    var factory = new ConnectionFactory { HostName = host, UserName = user, Password = pass };

    var originalQueue = queue[..^("_error".Length)];
    var toReplay = count.GetValueOrDefault(10);
    var moved = 0;

    using var conn = factory.CreateConnection();
    using var ch = conn.CreateModel();

    for (var i = 0; i < toReplay; i++)
    {
        var msg = ch.BasicGet(queue, autoAck: false);
        if (msg is null) break;

        var props = ch.CreateBasicProperties();
        if (msg.BasicProperties != null)
        {
            props.ContentType = msg.BasicProperties.ContentType;
            props.CorrelationId = msg.BasicProperties.CorrelationId;
            props.Headers = msg.BasicProperties.Headers;
            props.MessageId = msg.BasicProperties.MessageId;
            props.Type = msg.BasicProperties.Type;
        }

        ch.BasicPublish(exchange: "", routingKey: originalQueue, basicProperties: props, body: msg.Body);
        ch.BasicAck(msg.DeliveryTag, multiple: false);
        moved++;
    }

    return Results.Ok(new { from = queue, to = originalQueue, replayed = moved, requested = toReplay });
})
.WithDescription("Replays messages from MassTransit *_error queue back to original. Example: POST /dlq/replay?queue=billing-ordercreated_error&count=10");

app.Run();
