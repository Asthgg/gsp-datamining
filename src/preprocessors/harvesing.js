Number.prototype.toRad = function() {
    return this * Math.PI / 180;
 }
 
 var R = 6371; // km 
 //has a problem with the .toRad() method below.

 export const calculateDistance = (point1, point2) => {
    var x1 = point2.latitude - point1.latitude;
    var dLat = x1.toRad();  
    var x2 = point2.longitude-point1.longitude;
    var dLon = x2.toRad();  
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
                    Math.cos(point1.latitude.toRad()) * Math.cos(point2.latitude.toRad()) * 
                    Math.sin(dLon/2) * Math.sin(dLon/2);  
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; 

    return d;
 }