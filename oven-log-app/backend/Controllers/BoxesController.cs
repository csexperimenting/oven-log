using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OvenLogApi.Data;
using OvenLogApi.DTOs;
using OvenLogApi.Models;

namespace OvenLogApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BoxesController : ControllerBase
{
    private readonly OvenLogContext _context;

    public BoxesController(OvenLogContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<BoxDto>>> GetBoxes()
    {
        var boxes = await _context.Boxes
            .Include(b => b.Type)
            .Include(b => b.Manufacturer)
            .Include(b => b.Model)
            .Include(b => b.Location)
            .Select(b => new BoxDto
            {
                Id = b.Id,
                Type = b.Type.Name,
                Manufacturer = b.Manufacturer.Name,
                Model = b.Model.Name,
                ToolNumber = b.ToolNumber,
                Location = b.Location.Name,
                DefaultTemperature = b.DefaultTemperature,
                WarmUpTimeMinutes = b.WarmUpTimeMinutes
            })
            .ToListAsync();

        return Ok(boxes);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<BoxDto>> GetBox(int id)
    {
        var box = await _context.Boxes
            .Include(b => b.Type)
            .Include(b => b.Manufacturer)
            .Include(b => b.Model)
            .Include(b => b.Location)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (box == null)
        {
            return NotFound();
        }

        var dto = new BoxDto
        {
            Id = box.Id,
            Type = box.Type.Name,
            Manufacturer = box.Manufacturer.Name,
            Model = box.Model.Name,
            ToolNumber = box.ToolNumber,
            Location = box.Location.Name,
            DefaultTemperature = box.DefaultTemperature,
            WarmUpTimeMinutes = box.WarmUpTimeMinutes
        };

        return Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<BoxDto>> CreateBox(CreateBoxDto dto)
    {
        var box = new Box
        {
            TypeId = dto.TypeId,
            ManufacturerId = dto.ManufacturerId,
            ModelId = dto.ModelId,
            ToolNumber = dto.ToolNumber,
            LocationId = dto.LocationId,
            DefaultTemperature = dto.DefaultTemperature,
            WarmUpTimeMinutes = dto.WarmUpTimeMinutes
        };

        _context.Boxes.Add(box);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetBox), new { id = box.Id }, await GetBox(box.Id));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateBox(int id, CreateBoxDto dto)
    {
        var box = await _context.Boxes.FindAsync(id);
        if (box == null)
        {
            return NotFound();
        }

        box.TypeId = dto.TypeId;
        box.ManufacturerId = dto.ManufacturerId;
        box.ModelId = dto.ModelId;
        box.ToolNumber = dto.ToolNumber;
        box.LocationId = dto.LocationId;
        box.DefaultTemperature = dto.DefaultTemperature;
        box.WarmUpTimeMinutes = dto.WarmUpTimeMinutes;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBox(int id)
    {
        var box = await _context.Boxes.FindAsync(id);
        if (box == null)
        {
            return NotFound();
        }

        _context.Boxes.Remove(box);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("{id}/turn-on")]
    public async Task<ActionResult> TurnOnOven(int id)
    {
        var box = await _context.Boxes.FindAsync(id);
        if (box == null)
        {
            return NotFound();
        }

        if (!box.WarmUpTimeMinutes.HasValue)
        {
            return BadRequest("This oven does not require warm-up tracking");
        }

        var onEvent = new OnEvent
        {
            BoxId = id,
            TurnOnTime = DateTime.UtcNow
        };

        _context.OnEvents.Add(onEvent);
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Oven turned on. Wait {box.WarmUpTimeMinutes} minutes before adding TRAKs." });
    }
}
