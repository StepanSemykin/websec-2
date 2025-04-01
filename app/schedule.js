const REQUEST_FROM = "from"
const REQUEST_TO = "to"
const REQUEST_FROM_TO = "from_to"

const TRANSPORT_DICT = 
{
    train: "Поезд",
    suburban: "Электричка"
};

function dateTime(dateTime) 
{
    return luxon.DateTime.fromISO(dateTime, { setZone: true }) 
        .toFormat("dd.MM.yyyy HH:mm");
}


document.addEventListener("DOMContentLoaded", function () 
{   
    const title = document.getElementsByClassName("title")[0];
    const scheduleResults = document.getElementsByClassName("schedule-results")[0];

    const request = JSON.parse(localStorage.getItem("requestType"));
    const data = JSON.parse(localStorage.getItem("scheduleData"));

    if (data && !data.error && data.segments.length > 0)
    {
        if (request === REQUEST_FROM_TO) 
        {
            addScheduleFromTo(data, scheduleResults);

            title.innerHTML = "<h1>Расписание между станциями</h1>";
        }
        else if (request === REQUEST_FROM)
        {
            addScheduleFrom(data, scheduleResults);

            title.innerHTML = "<h1>Расписание по станции</h1>";
        }
        else if (request === REQUEST_TO)
        {
            addScheduleTo(data, scheduleResults);

            title.innerHTML = "<h1>Расписание по станции</h1>";
        }
    }
    else scheduleResults.innerHTML = "<h1>Расписание не найдено</h1>";
});


function addScheduleFromTo(data, element)
{
    const scheduleList = data.segments.map(segment => 
    {
        let hours = Math.floor(segment.duration / 3600);
        let minutes = Math.floor((segment.duration - hours * 3600) / 60);
        
        return `
            <div class="schedule-item">
                <span><strong>Станция отправления: </strong>${segment.from.title}</span>
                <span><strong>Время отправления: </strong>${dateTime(segment.departure)}</span>
                <span><strong>Нитка рейса: </strong>${segment.thread.title}, ${segment.thread.number}</span>
                <span><strong>Тип транспорта: </strong>${TRANSPORT_DICT[segment.thread.transport_type]}</span>
                <span><strong>Станция прибытия: </strong>${segment.to.title}</span>
                <span><strong>Время прибытия: </strong>${dateTime(segment.arrival)}</span>
                <span><strong>Длительность: </strong>${hours}ч ${minutes}мин</span>
            </div>`;
    }).join('');

    element.innerHTML = `<div class="schedule-list">${scheduleList}</div>`;
}


function addScheduleFrom(data, element)
{
    const scheduleList = data.schedule.map(sch => 
    {
        return`
            <div class="schedule-item">
                <span><strong>Станция отправления: </strong>${data.station.title}</span>
                <span><strong>Время отправления: </strong>${dateTime(sch.departure)}</span>
                <span><strong>Нитка рейса: </strong>${sch.thread.title}, ${sch.thread.number}</span>
                <span><strong>Тип транспорта: </strong>${TRANSPORT_DICT[sch.thread.transport_type]}</span>
            </div>`;
    }).join('');

    element.innerHTML = `<div class="schedule-list">${scheduleList}</div>`;
}


function addScheduleTo(data, element)
{
    const scheduleList = data.schedule.map(sch => 
    {
        return `
            <div class="schedule-item">
                <span><strong>Станция прибытия: </strong>${data.station.title}</span>
                <span><strong>Время прибытия: </strong>${dateTime(sch.arrival)}</span>
                <span><strong>Нитка рейса: </strong>${sch.thread.title}, ${sch.thread.number}</span>
                <span><strong>Тип транспорта: </strong>${TRANSPORT_DICT[sch.thread.transport_type] }</span>
            </div>`;
    }).join('');

    element.innerHTML = `<div class="schedule-list">${scheduleList}</div>`;
}