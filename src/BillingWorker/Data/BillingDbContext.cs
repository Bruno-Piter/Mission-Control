using Microsoft.EntityFrameworkCore;

namespace BillingWorker.Data;

public class BillingDbContext : DbContext
{
    public BillingDbContext(DbContextOptions<BillingDbContext> options) : base(options) { }

    public DbSet<ProcessedOrder> ProcessedOrders => Set<ProcessedOrder>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProcessedOrder>(e =>
        {
            e.HasKey(x => x.OrderId);
        });
    }
}

public class ProcessedOrder
{
    public string OrderId { get; set; } = default!;
    public string CustomerId { get; set; } = default!;
    public decimal Amount { get; set; }
    public DateTimeOffset ProcessedAtUtc { get; set; }
}
