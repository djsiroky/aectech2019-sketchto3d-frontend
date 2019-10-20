// Apple Pencil demo using Pressure.js

// Alternative method: https://github.com/quietshu/apple-pencil-safari-api-test

// If you want to go deeper into pointer events
// https://patrickhlauke.github.io/touch/
// https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent/pressure


/***********************
*       SETTINGS       *
************************/

// How sensitive is the brush size to the pressure of the pen?
var pressureMultiplier = 10; 

// What is the smallest size for the brush?
var minBrushSize = 1;

// Higher numbers give a smoother stroke
var brushDensity = 5;

var showDebug = true;
var showSimplifiedLines = false;

// Jitter smoothing parameters
// See: http://cristal.univ-lille.fr/~casiez/1euro/
var minCutoff = 0.0001; // decrease this to get rid of slow speed jitter but increase lag (must be > 0)
var beta      = 1.0;  // increase this to get rid of high speed lag


/***********************
*       GLOBALS        *
************************/
var xFilter, yFilter, pFilter;
var inBetween;
var prevPenX = 0;
var prevPenY = 0; 
var prevBrushSize = 1;
var amt, x, y, s, d;
var pressure = -2;
var drawCanvas, uiCanvas;
var isPressureInit = false;
var isDrawing = false;
var isDrawingJustStarted = false;
var newLineToDraw = false;
var allPoints = [];
var reducedPoints = [];
var lines = [];
var epsilon = 15;
const IP = '184.105.174.119';
const PORT = '8000';
let sideBarStyle = getComputedStyle(document.getElementsByClassName('sidenav')[0]);
let sideBarOffset = parseFloat(sideBarStyle.width) + parseFloat(sideBarStyle.paddingLeft) + parseFloat(sideBarStyle.paddingRight);

/***********************
*    DRAWING CANVAS    *
************************/
new p5(function(p) {
  
  p.setup = () => {
    
    // Filters used to smooth position and pressure jitter
    xFilter = new OneEuroFilter(60, minCutoff, beta, 1.0);
    yFilter = new OneEuroFilter(60, minCutoff, beta, 1.0);
    pFilter = new OneEuroFilter(60, minCutoff, beta, 1.0);
    
    // prevent scrolling on iOS Safari
    disableScroll();
    
    //Initialize the canvas
    drawCanvas = p.createCanvas((p.windowWidth - sideBarOffset)/2, p.windowHeight);
    drawCanvas.id("drawingCanvas");
    p.background(255);
    drawCanvas.position(sideBarOffset, 0);    
    drawCanvasElement = document.getElementById('drawingCanvas');
    drawCanvasElement.addEventListener('pre-img-upload', () => {
      lines = [];
      p.clear();
      p.background(255);
    });
    drawCanvasElement.addEventListener('img-upload', () => {
      sendToRunway((p.windowWidth - sideBarOffset)/2, p.windowHeight, sideBarOffset);
    });
  }

  p.mouseReleased = function () {
    if (reducedPoints.length > 0) {
      lines.push(reducedPoints);
      reducedPoints = [];
    }
    allPoints = [];
    sendToRunway((p.windowWidth - sideBarOffset)/2, p.windowHeight, sideBarOffset);
  }

  p.draw = function() {
    
    // Start Pressure.js if it hasn't started already
    if(isPressureInit == false){
      initPressure();
    }
      
    
    if(isDrawing) {      
      // Smooth out the position of the pointer 
      penX = xFilter.filter(p.mouseX, p.millis());
      penY = yFilter.filter(p.mouseY, p.millis());
      
      // What to do on the first frame of the stroke
      if(isDrawingJustStarted) {
        //console.log("started drawing");
        prevPenX = penX;
        prevPenY = penY;
      }

      // Smooth out the pressure
      pressure = pFilter.filter(pressure, p.millis());

      // Define the current brush size based on the pressure
      brushSize = minBrushSize + (pressure * pressureMultiplier);

      // Calculate the distance between previous and current position
      d = p.dist(prevPenX, prevPenY, penX, penY);

      // The bigger the distance the more ellipses
      // will be drawn to fill in the empty space
      inBetween = (d / p.min(brushSize,prevBrushSize)) * brushDensity;

      // Add ellipses to fill in the space 
      // between samples of the pen position
      for(i=1;i<=inBetween;i++){
        amt = i/inBetween;
        s = p.lerp(prevBrushSize, brushSize, amt);
        x = p.lerp(prevPenX, penX, amt);
        y = p.lerp(prevPenY, penY, amt);
        p.noStroke();
        p.fill(10)
        p.ellipse(x, y, s);      
        allPoints.push(p.createVector(x, y));
      }
      // Draw an ellipse at the latest position
      reducedPoints = simplifyLine(allPoints);
      p.noStroke();
      p.fill(10)
      p.ellipse(penX, penY, brushSize);

      if (showSimplifiedLines) {
        lines.forEach((line) => {
          p.stroke(255, 0, 255);
          p.strokeWeight(2);
          p.noFill();
          p.beginShape();
          line.forEach(v => {
            if (v) {
              p.vertex(v.x, v.y);
            }
          });
          p.endShape();
        });
      }

      // Save the latest brush values for next frame
      prevBrushSize = brushSize; 
      prevPenX = penX;
      prevPenY = penY;
      
      isDrawingJustStarted = false;
    }

    // clearing the canvas
    document.getElementById("ClearButton").onclick = function () { clearCanvas() };

    function clearCanvas() {
      lines = [];
      p.clear();
      p.background(255);
    }

    // document.getElementById("to3DModel").onclick =  () => {
    //   sendToRunway((p.windowWidth - 180)/2, p.windowHeight);
    // };

    
    
  }
}, "p5_instance_01");



/***********************
*      UI CANVAS       *
************************/
// new p5(function(p) {

//   	p.setup = function() {
//       uiCanvas = p.createCanvas(p.windowWidth - 180, p.windowHeight);
//       uiCanvas.id("uiCanvas");
//       uiCanvas.position(180, 0);
//     }
  
// //   	p.draw = function() {
      
// //       uiCanvas.clear();
      
// //       // if(showDebug){
// //       //   p.text("pressure = " + pressure, 10, 20);
        
// //       //   p.stroke(200,50);
// //       //   p.line(p.mouseX,0,p.mouseX,p.height);
// //       //   p.line(0,p.mouseY,p.width,p.mouseY);

// //       //   // The "loading bar" at the top
// //       //   // is only there as a visual indicator
// //       //   // that the sketch is running
// //       //   p.noStroke();
// //       //   p.fill(100)
// //       //   p.rect(0, 0, p.frameCount % p.width, 4);
// //       // }
// //     }

// }, "p5_instance_02");


/***********************
*       UTILITIES      *
************************/

// Initializing Pressure.js
// https://pressurejs.com/documentation.html
function initPressure() {
  
  	//console.log("Attempting to initialize Pressure.js ");
  
  Pressure.set('#drawingCanvas', {
      
      start: function(event){
        // this is called on force start
        isDrawing = true;
        isDrawingJustStarted = true;
  		},
      end: function(){
    		// this is called on force end
        isDrawing = false
        pressure = 0;
  		},
      change: function(force, event) {
        if (isPressureInit == false){
          console.log("Pressure.js initialized successfully");
	        isPressureInit = true;
      	}
        //console.log(force);
        pressure = force;
        
      }
    });
  
    Pressure.config({
      polyfill: true, // use time-based fallback ?
      polyfillSpeedUp: 1000, // how long does the fallback take to reach full pressure
      polyfillSpeedDown: 0,
      preventSelect: true,
      only: null
 		 });
  
}


// Disabling scrolling and bouncing on iOS Safari
// https://stackoverflow.com/questions/7768269/ipad-safari-disable-scrolling-and-bounce-effect

function preventDefault(e){
    e.preventDefault();
}

function disableScroll(){
    document.body.addEventListener('touchmove', preventDefault, { passive: false });
}
/*
function enableScroll(){
    document.body.removeEventListener('touchmove', preventDefault, { passive: false });
}*/

function rdp(startIndex, endIndex, allPoints, rdpPoints) {
  const nextIndex = findFurthest(allPoints, startIndex, endIndex);
  if (nextIndex > 0) {
    if (startIndex != nextIndex) {
      rdp(startIndex, nextIndex, allPoints, rdpPoints);
    }
    rdpPoints.push(allPoints[nextIndex]);
    if (endIndex != nextIndex) {
      rdp(nextIndex, endIndex, allPoints, rdpPoints);
    }
  }
}

function findFurthest(points, a, b) {
  let recordDistance = -1;
  const start = points[a];
  const end = points[b];
  let furthestIndex = -1;
  for (let i = a + 1; i < b; i++) {
    const currentPoint = points[i];
    const d = lineDist(currentPoint, start, end);
    if (d > recordDistance) {
      recordDistance = d;
      furthestIndex = i;
    }
  }
  if (recordDistance > epsilon) {
    return furthestIndex;
  } else {
    return -1;
  }
}

function lineDist(c, a, b) {
  const norm = scalarProjection(c, a, b);
  return p5.Vector.dist(c, norm);
}

function scalarProjection(p, a, b) {
  const ap = p5.Vector.sub(p, a);
  const ab = p5.Vector.sub(b, a);
  ab.normalize(); // Normalize the line
  ab.mult(ap.dot(ab));
  const normalPoint = p5.Vector.add(a, ab);
  return normalPoint;
}

function simplifyLine(allPts) {
  pts = [];
  const total = allPts.length;
  const start = allPts[0];
  const end = allPts[total - 1];
  pts.push(start);
  rdp(0, total - 1, allPts, pts);
  pts.push(end);
  return pts;
}

function canvasToModel() {
  let linesForBackend = [];
  lines.forEach(line => {
    let linePts = [];
    if (line.length > 0) {
      line.forEach(pt => {
        linePts.push([pt.x, pt.y]);
      });
    }
    linesForBackend.push(linePts);
  });
  console.log(linesForBackend);
}

function sendToRunway(w, h, sideBarOffset) {
  let dcanvas = document.getElementById('drawingCanvas');
  let dataurl = dcanvas.toDataURL();

  const inputs = { image: dataurl };
  fetch(`http://${IP}:${PORT}/query`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(inputs),
  })
    .then(response => response.json())
    .then(outputs => {
      const { image } = outputs;
      let imgCanvas = document.getElementById('imageCanvas');
      if (imgCanvas === null) {
        let body = document.getElementsByTagName('body')[0];
        imgCanvas = document.createElement('canvas');
        imgCanvas.id = "imageCanvas";
        imgCanvas.width = w;
        imgCanvas.height = h;
        imgCanvas.style.position = 'absolute';
        let offset = sideBarOffset + w;
        imgCanvas.style.left = `${offset}px`;
        imgCanvas.style.top = 0;
        body.append(imgCanvas);
      }
      let ctx = imgCanvas.getContext('2d');

      let img = new Image();
      img.onload = function () {
        ctx.drawImage(img, 0, 0, w, h);
      };
      img.src = image;
    });
} 
