const base_url = "http://localhost:5000";
const contactForm = document.getElementById("submit-form");
const loginlink = document.getElementById("form-foot");
loginlink.insertAdjacentHTML(
	"beforeend",
	`<p>dont have an account, sign up <a href="${base_url}/signup"> here</a></p>`,
);
contactForm.addEventListener("submit", function (event) {
	//event.preventDefault();

	let request = new XMLHttpRequest();
	let url = base_url + "/login_submit";
	request.open("POST", url, true);
	request.setRequestHeader("Content-Type", "application/json");
	request.onreadystatechange = function () {
		if (request.readyState === 4 && request.status === 200) {
			var jsonData = JSON.parse(request.response);
      // if (jsonData.success) {
			// 	console.log("Login successful:", jsonData);
			// 	// Handle successful login, e.g., redirect to the dashboard
			// 	window.location.href = base_url + "/todo";
			// }
			console.log(jsonData);
		}
	};
	let name = document.getElementById("name").value;
	let password = document.getElementById("password").value;

	let data = JSON.stringify({
		name: name,
		password: password,
	});

	request.send(data);
});
