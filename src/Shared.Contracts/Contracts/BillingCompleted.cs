namespace Shared.Contracts;

public record BillingCompleted(
    string OrderId,
    string CustomerId,
    decimal Amount,
    DateTimeOffset BilledAtUtc,
    string CorrelationId
);
