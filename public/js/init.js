(function($){
  $(function(){

    $('.sidenav').sidenav();

  }); // end of document ready
})(jQuery); // end of jQuery name space

// Grab the articles as a json
$.getJSON("/articles", function(data) {
  // For each one
  for (var i = 0; i < data.length; i++) {
    // Display the apropos information on the page
    $("#articles").append(
      //"<p data-id='" + data[i]._id + "'>" + data[i].title + "<br />" + data[i].link + "</p>"
     // `<h3 data-id='${data[i]._id}'>
     //   <a href="https://cbr.com${data[i].link}" target="blank">
     //     ${data[i].title}
     //   </a>
     // </h3>
     // <p data-id='${data[i]._id}'>
     //   ${data[i].body}
     // </p>
     // `

      `
      <div class="col s12 m10 offset-m1">
          <h4 data-id='${data[i]._id}'>
            <a href="https://cbr.com${data[i].link}" target="blank">
              ${data[i].title}
            </a>
          </h4>
          <p data-id='${data[i]._id}'>
            ${data[i].body}
          </p>
        </div>
      `
      );
  }
});
