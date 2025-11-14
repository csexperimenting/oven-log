namespace OvenLogApi.Models;

public class OnEvent
{
    public int Id { get; set; }
    public int BoxId { get; set; }
    public Box Box { get; set; } = null!;
    public DateTime TurnOnTime { get; set; }
}
