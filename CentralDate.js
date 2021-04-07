/*
Turn this in a class so we can dateformat like a normal language
*/

function Get(jsdate) {
    const Weekdays=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
    const Months=["January","February","March","April","May","June","July","August","September","October","November","December"];
    let workingdate
    if (jsdate == undefined) {
        workingdate = new Date()
    }
    else {
        workingdate = new Date(jsdate)
    }

    let tempminutes = workingdate.getMinutes()
    let temphours= workingdate.getHours()
    if (tempminutes < 10) {
      tempminutes="0"+tempminutes.toString()
    }
    if (temphours < 10) {
      temphours="0"+temphours.toString()
    }

    let result = {
        Hour: temphours,
        Minute: tempminutes,
        Date: workingdate.getDate(),
        Month: workingdate.getMonth()+1,
        Year: workingdate.getFullYear(),
        Time: workingdate.getTime(),
        Day: workingdate.getDay(),
        DayFull: Weekdays[workingdate.getDay()-1],
        MonthFull: Months[workingdate.getMonth()]
    }
    return result;
}

module.exports = {
    Get: Get
};