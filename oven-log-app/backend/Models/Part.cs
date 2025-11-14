namespace OvenLogApi.Models;

public class Part
{
    public int Id { get; set; }
    public string PartNumber { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ICollection<Trak> Traks { get; set; } = new List<Trak>();
}
