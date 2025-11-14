namespace OvenLogApi.Models;

public class Location
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public ICollection<Box> Boxes { get; set; } = new List<Box>();
}
