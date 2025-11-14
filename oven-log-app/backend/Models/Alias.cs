namespace OvenLogApi.Models;

public class Alias
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string AliasLogin { get; set; } = string.Empty;
}
