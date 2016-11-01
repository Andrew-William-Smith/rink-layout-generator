var classes = [{'name': '', 'students': NaN, 'factor': 1.5}]

function renderRink() {
  var totalSpaces = 0;
  classes.forEach(function(space) {
    var allotment = 0;
    if (!isNaN(space.students)) allotment = space.students * space.factor;
    if (allotment < 5) allotment = 5;
    totalSpaces += allotment;
  });

  var rink = $('#rinkOutline');
  var rinkBounds = rink[0].getBBox();
  var yPerUnit = rinkBounds.height / totalSpaces;
  var previousLineY = rink[0].getBBox().y;

  $('rect').remove();
  $('.classLabel').remove();

  for (var i = 0; i < classes.length; i++) {
    var currentClass = classes[i];
    if (!isNaN(currentClass.students) && currentClass.factor > 0) {
      // Determine space allotment
      var allotment = currentClass.students * currentClass.factor;
      if (allotment < 5) allotment = 5;

      // Add dividing line, except at end
      var newLineY = previousLineY + (allotment * yPerUnit);
      if (i != classes.length - 1) {
        var line = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        line.setAttribute('height', 2);
        line.setAttribute('width', 254);
        line.setAttribute('x', 73);
        line.setAttribute('y', newLineY);
        $('svg').append(line);
      }

      // Add title
      var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.innerHTML = currentClass.name;
      text.style = 'font-family: sans-serif; font-size: 15px; font-weight: 600';
      // Hack to get text size before display
      var textTemp = $(text).appendTo($('svg'));
      var textBox = textTemp[0].getBBox();
      textTemp.remove();
      // Properly center text
      text.setAttribute('class', 'classLabel');
      text.setAttribute('x', ((rinkBounds.x + (rinkBounds.x + rinkBounds.width)) / 2) - (textBox.width / 2));
      text.setAttribute('y', (previousLineY + newLineY) / 2 + (textBox.height / 2));
      $('svg').append(text);

      previousLineY = newLineY;
    }
  }
}

$(document).ready(function() {
  // Resize rink illustration to fit window
  $('#layout').attr('height', $(window).height() - 80);
  $(window).resize(function() {
    $('#layout').attr('height', $(window).height() - 80);
  });

  // Prevent deletion of the first class
  $('tbody .removeClass').prop('disabled', true);

  $('table').on('click', '.addClass', function() {
    var parentRow = $(this).closest('tr');
    var newRow = $('tbody tr').first().clone();

    // Clean input for insertion
    $('.removeClass', newRow).prop('disabled', false);
    $('.className', newRow).val('');
    $('.studentNumber', newRow).val('');
    $('.studentFactor', newRow).val('1.5');

    parentRow.after(newRow);
    classes.splice(parentRow.index() + 1, 0, {'name': '', 'students': NaN, 'factor': 1.5});
  });

  $('table').on('click', '.removeClass', function() {
    var parentRow = $(this).closest('tr');
    classes.splice(parentRow.index(), 1);
    parentRow.remove();
    renderRink();
  });

  $('table').on('input', '.className', function() {
    var parentRow = $(this).closest('tr');
    classes[parentRow.index()].name = $(this).val();
    renderRink();
  });

  $('table').on('input', '.studentNumber', function() {
    var parentRow = $(this).closest('tr');
    classes[parentRow.index()].students = parseInt($(this).val());
    renderRink();
  });

  $('table').on('click', 'a', function() {
    var parentRow = $(this).closest('tr');
    classes[parentRow.index()].factor = +$(this).attr('value');
    $('input', $(this).closest('.input-group')).val($(this).attr('value')).focus();
    renderRink();
  });

  $('table').on('input', '.studentFactor', function() {
    var parentRow = $(this).closest('tr');
    classes[parentRow.index()].factor = +$(this).val();
    renderRink();
  });

  // Offer layout for download
  $('#downloadLink').click(function() {
      $(this).attr('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent($('.col-md-3').html()));
      $(this).click();
  });

  // Allow layout clearing
  $('#clearLayout').click(function() {
    classes = [{'name': '', 'students': NaN, 'factor': 1.5}];

    // Clean first row
    $('tr').slice(2).remove();
    $('.className').val('');
    $('.studentNumber').val('');
    $('.studentFactor').val('1.5');
    renderRink();
  });
});
