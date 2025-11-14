namespace OvenLogApi.Models;

public class User
{
    public int Id { get; set; }
    public string Login { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Name { get; set; }
    public string? BadgeNumber { get; set; }
    public int? AssignedBoxId { get; set; }
    public ICollection<Alias> Aliases { get; set; } = new List<Alias>();
    public ICollection<Event> Events { get; set; } = new List<Event>();
    public ICollection<UserOven> UserOvens { get; set; } = new List<UserOven>();
}
