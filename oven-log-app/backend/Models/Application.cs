namespace OvenLogApi.Models;

public class Application
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int? DefaultBakeTimeMinutes { get; set; }
    public ICollection<Event> Events { get; set; } = new List<Event>();
}
