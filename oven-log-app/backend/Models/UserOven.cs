namespace OvenLogApi.Models;

public class UserOven
{
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int BoxId { get; set; }
    public Box Box { get; set; } = null!;
}
