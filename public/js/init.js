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
  };
});

$("#clear-button").on("click", function() {
  // Keep the page from reloading.
  event.preventDefault();
  // Need to place reload here or it won't fire.
  location.reload();

  $.ajax({
      type: 'DELETE',
      url: '/delete',
      success: function(response) {
          if (response == 'error') {
              console.log('Err!');
          }
      }
  });
});
