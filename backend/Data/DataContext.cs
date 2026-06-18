using Adashop.Entities;
using Microsoft.EntityFrameworkCore;

namespace Adashop.Data;

public class DataContext : DbContext
{
    public DbSet<User> Users { get; set; }
    public DbSet<UserDetails> UserDetails { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<ProductSpec> ProductSpecs { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<ProductImage> ProductImages { get; set; }
    public DbSet<CartItem> CartItems { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderItem> OrderItems { get; set; }
    public DbSet<DeliveryMethod> DeliveryMethods { get; set; }

    public DataContext(DbContextOptions<DataContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // User - UserDetails (one-to-one)
        modelBuilder.Entity<User>()
            .HasOne(u => u.UserDetails)
            .WithOne(ud => ud.User)
            .HasForeignKey<UserDetails>(ud => ud.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Unique email
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // Product - Category
        modelBuilder.Entity<Product>()
            .HasOne(p => p.Category)
            .WithMany(c => c.Products)
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        // Product - ProductImage
        modelBuilder.Entity<ProductImage>()
            .HasOne(pi => pi.Product)
            .WithMany(p => p.Images)
            .HasForeignKey(pi => pi.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        // Product - ProductSpec (one-to-one)
        modelBuilder.Entity<ProductSpec>()
            .HasOne(ps => ps.Product)
            .WithOne()
            .HasForeignKey<ProductSpec>(ps => ps.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        // Price precision
        modelBuilder.Entity<Product>()
            .Property(p => p.Price)
            .HasPrecision(18, 2);

        // ProductImage unique sort order
        modelBuilder.Entity<ProductImage>()
            .HasIndex(pi => new { pi.ProductId, pi.SortOrder });

        // Category hierarchy
        modelBuilder.Entity<Category>()
            .HasOne(c => c.ParentCategory)
            .WithMany(c => c.Children)
            .HasForeignKey(c => c.ParentCategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        // CartItem - User
        modelBuilder.Entity<CartItem>()
            .HasOne(ci => ci.User)
            .WithMany(u => u.CartItems)
            .HasForeignKey(ci => ci.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Unique cart item per user+product
        modelBuilder.Entity<CartItem>()
            .HasIndex(ci => new { ci.UserId, ci.ProductId })
            .IsUnique();

        // Order - User
        modelBuilder.Entity<Order>()
            .HasOne(o => o.User)
            .WithMany(u => u.Orders)
            .HasForeignKey(o => o.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Order - DeliveryMethod
        modelBuilder.Entity<Order>()
            .HasOne(o => o.DeliveryMethod)
            .WithMany(d => d.Orders)
            .HasForeignKey(o => o.DeliveryMethodId)
            .OnDelete(DeleteBehavior.SetNull);

        // Order indexes
        modelBuilder.Entity<Order>()
            .HasIndex(o => o.Status);
        modelBuilder.Entity<Order>()
            .HasIndex(o => o.UserId);

        // Order price precision
        modelBuilder.Entity<Order>()
            .Property(o => o.TotalPrice)
            .HasPrecision(18, 2);
        modelBuilder.Entity<Order>()
            .Property(o => o.DeliveryPrice)
            .HasPrecision(18, 2);

        // OrderItem - Order
        modelBuilder.Entity<OrderItem>()
            .HasOne(oi => oi.Order)
            .WithMany(o => o.OrderItems)
            .HasForeignKey(oi => oi.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        // OrderItem - Product
        modelBuilder.Entity<OrderItem>()
            .HasOne<Product>()
            .WithMany()
            .HasForeignKey(oi => oi.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<OrderItem>()
            .Property(oi => oi.ProductPriceSnapshot)
            .HasPrecision(18, 2);

        // DeliveryMethod price precision
        modelBuilder.Entity<DeliveryMethod>()
            .Property(d => d.Price)
            .HasPrecision(18, 2);
    }
}
