/**
 * DO NOT MODIFY THE FUNCTION NAME
 *
 * Takes in a stroke and returns a list of substrokes
 * A stroke is just an array of points. A point has properties x, y, and time (in ms since epoch).
 * A substroke is also a list of points, just like a stroke
 */
 
export function segment(stroke) {
	var resampledStroke=[];
	var segmentedStrokes=[];
	resampledStroke=reSampleStroke(stroke);
	var corners = [];
	corners=getCorners(resampledStroke);
	for(var i=0;i<corners.length-1;i++){
		var subStrokes=[];
		var start = corners[i];
		var end=corners[i+1];
		for(var j=start;j<=end;j++){
			var l=resampledStroke[j];
			subStrokes.push(l);
			//console.log(subStrokes +"\n")
		}
		segmentedStrokes[i]=subStrokes;
		console.log(segmentedStrokes+"\n");
	}
	var cornerStrokePoints=[];
	for(var i=0;i<corners.length;i++){
		var k=corners[i];
		var l=resampledStroke[k];
		cornerStrokePoints.push(l);
	}
	showResampled(cornerStrokePoints); // Draws the corner points on the stroke
    return segmentedStrokes; // returns the segmented strokes
};

function diagonalDistanceBoundingBox(stroke){
	var xMax=Number.MIN_VALUE;
	var yMax=Number.MIN_VALUE;
	var xMin=Number.MAX_VALUE;
	var yMin=Number.MAX_VALUE;
	var i;
	for(i=0;i<stroke.length;i++){
		xMax=Math.max(stroke[i].x,xMax);
		yMax=Math.max(stroke[i].y,yMax);
		xMin=Math.min(stroke[i].x,xMin);
		yMin=Math.min(stroke[i].y,yMin);
	}
	var f3=Math.sqrt(Math.pow(xMax-xMin,2)+Math.pow(yMax-yMin,2));
	return f3;
}

function reSampleStroke(stroke){
	var diagonal=diagonalDistanceBoundingBox(stroke);
	var S = diagonal/40.0;
	var resampled=[];
	resampled.push(stroke[0]);
	var D=0;


	for(var i=1;i<stroke.length;i++){
		var d= Math.sqrt(Math.pow(stroke[i].x-stroke[i-1].x,2)+Math.pow(stroke[i].y-stroke[i-1].y,2));
		if (d+D>=S){
			var rx= stroke[i-1].x +((stroke[i].x-stroke[i-1].x)*((S-D)/d));
			var ry= stroke[i-1].y +((stroke[i].y-stroke[i-1].y)*((S-D)/d));
			var rtime=stroke[i].time;

			var q={x: rx , y: ry, time: rtime};
			resampled.push(q);
			stroke.splice(i,0,q);
			D=0.0;
		}
		else {D=D+d;}

	}
	resampled.push(stroke[stroke.length-1]);
	return resampled;
}
function getCorners(stroke){
	var corners=[];
	var straws=[];
	straws[0]=0;
	straws[1]=0;
	straws[2]=0;
	corners.push(0);
	var w =3;
	var totalStraw=0;
	for(var i=w;i<stroke.length-w;i++){
		var s=Math.sqrt(Math.pow(stroke[i+w].x-stroke[i-w].x,2)+Math.pow(stroke[i+w].y-stroke[i-w].y,2));
		totalStraw=totalStraw+s;
		straws.push(s);
	}
	var medianStraw= getMedian(straws)*0.95;
	var q=null;
	for(q=w;q<stroke.length-w;q++){
		if(straws[q]<medianStraw){
			var localMin=Number.MAX_VALUE;
			var localMinIndex=q;
			while(q<straws.length && straws[q]<medianStraw){
				if(straws[q]<localMin){
					localMin=straws[q];
					localMinIndex=q;
				}
				q=q+1;
			}
			corners.push(localMinIndex);
		}
	}
	corners.push(stroke.length-1);
	var postProcessedCorners=[];
	postProcessedCorners=postProcessCorners(corners,straws,stroke);
	return postProcessedCorners;
}
function getMedian(straws){
	straws.sort(function(a, b){return a-b;});
	var median=null;
	var mid=Math.floor(straws.length/2);
	if(straws.length%2){
		median=straws[mid];
	}else{
		median=(straws[mid]+straws[mid-1])/2;
		
	}
	return median;
}
function postProcessCorners(corners,straws,stroke){
	var c=false;
	var i=null;
	while(!c){
		c=true;
		for(i=1;i<corners.length;i++){
			var c1=corners[i-1];
			var c2=corners[i];
			if(!isLine(stroke,c1,c2)){
				var newCorner=halfWayCorner(straws,c1,c2);
				if(newCorner!=c1 && newCorner!=c2){
					corners.splice(i,0,newCorner);
				    c=false;
				}
				
			}
		}
	}
	var j=null;
	for(j=1;j<corners.length-1;j++){
		var p1=corners[j-1];
		var p2=corners[j+1];
		if(isLine(stroke,p1,p2)){
			corners.splice(j,1);
			j=j-1;
		}
	}

	return corners;
}

function isLine(stroke,c1,c2){
	try{
	var threshold=0.95;
	var distance= Math.sqrt(Math.pow(stroke[c2].x-stroke[c1].x,2)+Math.pow(stroke[c2].y-stroke[c1].y,2));
	var pathDistance=getPathDistance(stroke,c1,c2);
	if((distance/pathDistance)>threshold){
		return true;
	}else{
		return false;
	}
}catch(e){
	if(e){
		return false;
	}
}
}
function halfWayCorner(straws,c1,c2){
	var quarter=Math.floor((c2-c1)/4);
	var minValue=Number.MAX_VALUE;
	var minIndex=c1;
	var i=0;
	for(i=c1+quarter;i<c2-quarter;i++){
		if(straws[i]<minValue){
			minValue=straws[i];
			minIndex=i;
		}
	}
	return minIndex;
}
function getPathDistance(stroke,c1,c2){
	var path=0;
	for(var i= c1;i<c2-1;i++){
		path=path+Math.sqrt(Math.pow(stroke[i+1].x-stroke[i].x,2)+Math.pow(stroke[i+1].y-stroke[i].y,2));
	}
	return path;
}