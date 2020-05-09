const https = require('https');
const jsdom = require('jsdom');
const {JSDOM} = jsdom;
const post_data = {
	"cookie": {"name":"", "content":""},
	"username": "",
	"password": "",
	"lt": "",
	"execution": "e1s1",
	"_eventId": "submit"
};

https.get('https://cas.univ-tln.fr/cas/login', (res) => {
	console.log('statusCode:', res.statusCode);
	var cookie = res.headers['set-cookie'][0].split(";")[0].split("=");
	post_data.cookie.name = cookie[0];
	post_data.cookie.content = cookie[1];

	res.on('data', (d) => {
		const dom = new JSDOM(d);
		var input = dom.window.document.querySelectorAll('input[type="hidden"]')[0];
		post_data.lt = input.value;

		console.log("Post Data : ", post_data);
	});

}).on('error', (e) => {
	console.error(e);
});
