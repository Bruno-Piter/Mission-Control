namespace Shared.Contracts;

public record OrderCreated(
    string OrderId,
    string CustomerId,
    decimal Amount,
    DateTimeOffset OccurredAtUtc,
    string CorrelationId
);
