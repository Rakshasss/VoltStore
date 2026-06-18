using Adashop.DTOs;
using FluentValidation;

namespace Adashop.Validators.Order;

public class CreateOrderValidator : AbstractValidator<CreateOrderRequest>
{
    public CreateOrderValidator()
    {
        RuleFor(x => x.ShippingAddress)
            .NotEmpty().WithMessage("Shipping address is required")
            .Length(5, 200).WithMessage("Shipping address must be between 5 and 200 characters");

        RuleFor(x => x.PaymentMethod)
            .Must(m => m == "Card" || m == "Cash")
            .WithMessage("Payment method must be Card or Cash");
    }
}
