/*
Turn this in a class so we can dateformat like a normal language
*/

function Get(jsdate) {
    const Weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const Months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let workingdate
    if (jsdate == undefined) {
        workingdate = new Date()
    }
    else {
        workingdate = new Date(jsdate)
    }

    let tempminutes = workingdate.getMinutes()
    let temphours = workingdate.getHours()
    if (tempminutes < 10) {
        tempminutes = "0" + tempminutes.toString()
    }
    if (temphours < 10) {
        temphours = "0" + temphours.toString()
    }

    let result = {
        Date: workingdate.getDate(),
        Day: workingdate.getDay(),
        FullYear: workingdate.getFullYear(),
        Hours: temphours,
        Minutes: tempminutes,
        Month: workingdate.getMonth() + 1,
        Seconds: workingdate.getSeconds(),
        Time: workingdate.getTime(),
        TimezoneOffset: workingdate.getTimezoneOffset(),
        TimeString: temphours + ":" + tempminutes,
        FullDay: Weekdays[workingdate.getDay()],
        FullMonth: Months[workingdate.getMonth()]
    }
    if (jsdate != undefined) {
        result.Source = jsdate
    }
    return result;
}

module.exports = {
    Get: Get
};