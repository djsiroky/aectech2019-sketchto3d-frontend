function setup(){
    
createCanvas(outerWidth, outerHeight);
    
socket = io.connect("https://lit-dawn-54484.herokuapp.com/");
socket.on('mouse', newDrawing); 
}
    
function newDrawing(data){
   line(data.x, data.y, data.x1, data.y1);
}

function mouseDragged(){
    console.log('sending:' + mouseX + ',' + mouseY + ',' + pmouseX + ',' + pmouseY);
    
    var data = {
        x: mouseX,
        y: mouseY,
        x1: pmouseX,
        y1: pmouseY
    }
    
    socket.emit('mouse', data);
    line(mouseX, mouseY, pmouseX, pmouseY);
}

function draw(){
    
}