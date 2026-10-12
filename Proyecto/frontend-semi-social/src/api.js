const API_PYTHON = "http://3.144.219.97:5000";
const API_NODE = "http://localhost:5001";

export {
    API_PYTHON,
    API_NODE
};

// The urls to the apis should be replace with the url of the load balancer
// const API_URL = "http://my-load-balancer-123456.us-east-2.elb.amazonaws.com";
// To be replaced with the url of the load balancer
// The balancer will decide whether Python or JS on its own; the react app shouldn't know which api is using 
// Hope it works otherwise... I get to spend a whole night configuring AWS-- :) 

// If all of that doesn't work, we can just use the python api for everything and not use the node api at all. But shhh, shouldn't tell anyone.
// Copilot say something: 
// *He in fact said nothing*
// You are being shy, weird, normally you like to ramble about stuff and give long explanations kek
// Anyway, that's not the correct aproach but I'd rather have a half point that nuttin 