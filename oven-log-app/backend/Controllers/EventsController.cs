using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OvenLogApi.Data;
using OvenLogApi.DTOs;
using OvenLogApi.Models;

namespace OvenLogApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EventsController : ControllerBase
{
    private readonly OvenLogContext _context;

    public EventsController(OvenLogContext context)
    {
        _context = context;
    }

    [HttpGet("in-ovens")]
    public async Task<ActionResult<IEnumerable<EventDto>>> GetTraksInOvens()
    {
        var events = await _context.Events
            .Include(e => e.Trak).ThenInclude(t => t.Part)
            .Include(e => e.Box).ThenInclude(b => b.Location)
            .Include(e => e.User)
            .Include(e => e.Application)
            .Where(e => e.OvenOutTime == null)
            .OrderBy(e => e.OvenInTime)
            .ToListAsync();

        var now = DateTime.UtcNow;
        var dtos = events.Select(e =>
        {
            var plannedEndTime = e.OvenInTime.AddMinutes(e.PlannedBakeTimeMinutes);
            var timeRemaining = (int)(plannedEndTime - now).TotalMinutes;
            
            return new EventDto
            {
                Id = e.Id,
                TrakId = e.Trak.TrakId,
                PartNumber = e.Trak.Part.PartNumber,
                SerialNumber = e.Trak.SerialNumber,
                BoxId = e.BoxId,
                BoxName = e.Box.ToolNumber,
                Location = e.Box.Location.Name,
                UserBadge = e.User.BadgeNumber ?? e.User.Login,
                ApplicationName = e.Application?.Name,
                Temperature = e.Temperature,
                Quantity = e.Quantity,
                OvenInTime = e.OvenInTime,
                OvenOutTime = e.OvenOutTime,
                PlannedBakeTimeMinutes = e.PlannedBakeTimeMinutes,
                ActualBakeTimeMinutes = e.ActualBakeTimeMinutes,
                TimeRemainingMinutes = timeRemaining > 0 ? timeRemaining : 0,
                Notes = e.Notes
            };
        }).ToList();

        return Ok(dtos);
    }

    [HttpPost]
    public async Task<ActionResult<EventDto>> AddTrakToOven(CreateEventDto dto)
    {
        var trak = await _context.Traks
            .Include(t => t.Part)
            .FirstOrDefaultAsync(t => t.TrakId == dto.TrakId);

        if (trak == null)
        {
            return NotFound("TRAK not found");
        }

        var existingEvent = await _context.Events
            .FirstOrDefaultAsync(e => e.TrakId == trak.Id && e.OvenOutTime == null);

        if (existingEvent != null)
        {
            return Conflict("TRAK is already in an oven");
        }

        var box = await _context.Boxes
            .Include(b => b.Location)
            .FirstOrDefaultAsync(b => b.Id == dto.BoxId);

        if (box == null)
        {
            return NotFound("Box not found");
        }

        if (box.WarmUpTimeMinutes.HasValue)
        {
            var lastOnEvent = await _context.OnEvents
                .Where(o => o.BoxId == dto.BoxId)
                .OrderByDescending(o => o.TurnOnTime)
                .FirstOrDefaultAsync();

            if (lastOnEvent != null)
            {
                var warmUpEndTime = lastOnEvent.TurnOnTime.AddMinutes(box.WarmUpTimeMinutes.Value);
                if (DateTime.UtcNow < warmUpEndTime)
                {
                    return BadRequest($"Oven is still warming up. Wait until {warmUpEndTime}");
                }
            }
        }

        var user = await _context.Users.FirstOrDefaultAsync();
        if (user == null)
        {
            user = new User { Login = "system", BadgeNumber = "000" };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }

        var ovenInTime = dto.OvenInTime ?? DateTime.UtcNow;

        var newEvent = new Event
        {
            TrakId = trak.Id,
            BoxId = dto.BoxId,
            UserId = user.Id,
            ApplicationId = dto.ApplicationId,
            Temperature = dto.Temperature,
            Quantity = dto.Quantity,
            OvenInTime = ovenInTime,
            PlannedBakeTimeMinutes = dto.PlannedBakeTimeMinutes,
            Notes = dto.Notes
        };

        _context.Events.Add(newEvent);
        await _context.SaveChangesAsync();

        var result = new EventDto
        {
            Id = newEvent.Id,
            TrakId = trak.TrakId,
            PartNumber = trak.Part.PartNumber,
            SerialNumber = trak.SerialNumber,
            BoxId = box.Id,
            BoxName = box.ToolNumber,
            Location = box.Location.Name,
            UserBadge = user.BadgeNumber ?? user.Login,
            Temperature = newEvent.Temperature,
            Quantity = newEvent.Quantity,
            OvenInTime = newEvent.OvenInTime,
            PlannedBakeTimeMinutes = newEvent.PlannedBakeTimeMinutes,
            Notes = newEvent.Notes
        };

        return CreatedAtAction(nameof(GetTraksInOvens), new { id = newEvent.Id }, result);
    }

    [HttpPost("batch")]
    public async Task<ActionResult<IEnumerable<EventDto>>> AddMultipleTraksToOven(BatchCreateEventDto dto)
    {
        var results = new List<EventDto>();

        foreach (var trakId in dto.TrakIds)
        {
            var createDto = new CreateEventDto
            {
                TrakId = trakId,
                BoxId = dto.BoxId,
                ApplicationId = dto.ApplicationId,
                Temperature = dto.Temperature,
                Quantity = dto.Quantity,
                OvenInTime = dto.OvenInTime,
                PlannedBakeTimeMinutes = dto.PlannedBakeTimeMinutes,
                Notes = dto.Notes
            };

            var result = await AddTrakToOven(createDto);
            if (result.Result is CreatedAtActionResult createdResult)
            {
                results.Add((EventDto)createdResult.Value!);
            }
        }

        return Ok(results);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> RemoveTrakFromOven(int id)
    {
        var evt = await _context.Events.FindAsync(id);
        if (evt == null)
        {
            return NotFound();
        }

        if (evt.OvenOutTime != null)
        {
            return BadRequest("TRAK has already been removed from oven");
        }

        evt.OvenOutTime = DateTime.UtcNow;
        evt.ActualBakeTimeMinutes = (int)(evt.OvenOutTime.Value - evt.OvenInTime).TotalMinutes;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("recent")]
    public async Task<ActionResult<IEnumerable<EventDto>>> GetRecentActivity()
    {
        var twentyFourHoursAgo = DateTime.UtcNow.AddHours(-24);

        var events = await _context.Events
            .Include(e => e.Trak).ThenInclude(t => t.Part)
            .Include(e => e.Box).ThenInclude(b => b.Location)
            .Include(e => e.User)
            .Include(e => e.Application)
            .Where(e => e.OvenInTime >= twentyFourHoursAgo)
            .OrderByDescending(e => e.OvenInTime)
            .Select(e => new EventDto
            {
                Id = e.Id,
                TrakId = e.Trak.TrakId,
                PartNumber = e.Trak.Part.PartNumber,
                SerialNumber = e.Trak.SerialNumber,
                BoxId = e.BoxId,
                BoxName = e.Box.ToolNumber,
                Location = e.Box.Location.Name,
                UserBadge = e.User.BadgeNumber ?? e.User.Login,
                ApplicationName = e.Application != null ? e.Application.Name : null,
                Temperature = e.Temperature,
                Quantity = e.Quantity,
                OvenInTime = e.OvenInTime,
                OvenOutTime = e.OvenOutTime,
                PlannedBakeTimeMinutes = e.PlannedBakeTimeMinutes,
                ActualBakeTimeMinutes = e.ActualBakeTimeMinutes,
                Notes = e.Notes
            })
            .ToListAsync();

        return Ok(events);
    }

    [HttpGet("all")]
    public async Task<ActionResult<IEnumerable<EventDto>>> GetAllEvents()
    {
        var events = await _context.Events
            .Include(e => e.Trak).ThenInclude(t => t.Part)
            .Include(e => e.Box).ThenInclude(b => b.Location)
            .Include(e => e.User)
            .Include(e => e.Application)
            .OrderByDescending(e => e.OvenInTime)
            .Select(e => new EventDto
            {
                Id = e.Id,
                TrakId = e.Trak.TrakId,
                PartNumber = e.Trak.Part.PartNumber,
                SerialNumber = e.Trak.SerialNumber,
                BoxId = e.BoxId,
                BoxName = e.Box.ToolNumber,
                Location = e.Box.Location.Name,
                UserBadge = e.User.BadgeNumber ?? e.User.Login,
                ApplicationName = e.Application != null ? e.Application.Name : null,
                Temperature = e.Temperature,
                Quantity = e.Quantity,
                OvenInTime = e.OvenInTime,
                OvenOutTime = e.OvenOutTime,
                PlannedBakeTimeMinutes = e.PlannedBakeTimeMinutes,
                ActualBakeTimeMinutes = e.ActualBakeTimeMinutes,
                Notes = e.Notes
            })
            .ToListAsync();

        return Ok(events);
    }
}
