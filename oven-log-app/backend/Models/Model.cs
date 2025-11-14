namespace OvenLogApi.Models;

public class Model
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int ManufacturerId { get; set; }
    public Manufacturer Manufacturer { get; set; } = null!;
    public ICollection<Box> Boxes { get; set; } = new List<Box>();
}
