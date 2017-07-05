var classes = [{'name': '', 'students': NaN, 'factor': 1.5, 'factorSrc': 'input'}];
var dragDivides, rinkSVG, scalePoint, startDrag;
var rink, rinkBounds, yPerUnit;

// Compensate for SVG autoscaling in mouse coordinates
function svgCoords(evt) {
  scalePoint.x = evt.clientX;
  scalePoint.y = evt.clientY;
  return scalePoint.matrixTransform(rinkSVG[0].getScreenCTM().inverse());
}

function renderRink() {
  var totalSpaces = 0;
  classes.forEach(function(space) {
    if (!isNaN(space.students)) space.allotment = space.students * space.factor;
    else space.allotment = 0;
    if (allotment < 5 && space.factorSrc === 'input') space.allotment = 5;
    totalSpaces += space.allotment;
  });

  rink = $('#rinkOutline');
  rinkBounds = rink[0].getBBox();
  yPerUnit = rinkBounds.height / totalSpaces;
  var previousLineY = rink[0].getBBox().y;

  $('rect').remove();
  $('.classLabel').remove();

  for (var i = 0; i < classes.length; i++) {
    var currentClass = classes[i];
    if (!isNaN(currentClass.students) && currentClass.factor > 0) {
      // Determine space allotment
      var allotment = currentClass.allotment;
      var newLineY = previousLineY + (allotment * yPerUnit);

      // Add title
      var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.innerHTML = currentClass.name;
      text.style = 'font-family: sans-serif; font-size: 15px; font-weight: 600';
      // Hack to get text size before display
      var textTemp = $(text).appendTo(rinkSVG);
      var textBox = textTemp[0].getBBox();
      textTemp.remove();
      // Properly center text
      text.setAttribute('class', 'classLabel');
      text.setAttribute('x', ((rinkBounds.x + (rinkBounds.x + rinkBounds.width)) / 2) - (textBox.width / 2));
      text.setAttribute('y', (previousLineY + newLineY) / 2 + (textBox.height / 2));
      // Data for loading
      text.setAttribute('data-students', currentClass.students);
      text.setAttribute('data-factor', currentClass.factor);
      text.setAttribute('data-factor-src', currentClass.factorSrc);
      rinkSVG.append(text);

      // Add dividing line, except at end
      if (i != classes.length - 1) {
        var line = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        line.setAttribute('class', 'classDivider');
        line.setAttribute('height', 2);
        line.setAttribute('width', 254);
        line.setAttribute('x', 73);
        line.setAttribute('y', newLineY - 1);
        rinkSVG.append(line);

        // Draw drag handle
        var drag = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        drag.setAttribute('class', 'dividerDrag');
        drag.setAttribute('id', 'drag' + i);
        drag.setAttribute('height', 24);
        drag.setAttribute('width', 254);
        drag.setAttribute('x', 73);
        drag.setAttribute('y', newLineY - 12);
        rinkSVG.append(drag);
      }

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

  // Allow dragging of class dividers
  rinkSVG = $('svg');
  scalePoint = rinkSVG[0].createSVGPoint();

  rinkSVG
    .on('mousedown', '.dividerDrag', function(evt) {
      startDrag = svgCoords(evt).y;
      dragDivides = +$(this).attr('id').replace('drag', '');
    })
    .on('mousemove', '.dividerDrag', function(evt) {
      if (startDrag != null) {
        var currentY = svgCoords(evt).y;
        var yDiff = startDrag - currentY;
        $(this).attr('y', +$(this).attr('y') - yDiff);
        startDrag = currentY;

        var class1 = classes[dragDivides];
        class1.factor -= (yDiff * (1 / yPerUnit)) / class1.students;
        // Prevent classes from disappearing; reset to usual minimum size
        if (class1.factor <= 0) class1.factor = 5 / class1.students;
        class1.factorSrc = 'drag';
        $('.studentFactor').eq(dragDivides).val(class1.factor.toFixed(2));

        var class2 = classes[dragDivides + 1];
        class2.factor += (yDiff * (1 / yPerUnit)) / class2.students;
        if (class2.factor <= 0) class2.factor = 5 / class2.students;
        class2.factorSrc = 'drag';
        $('.studentFactor').eq(dragDivides + 1).val(class2.factor.toFixed(2));
      }
    })
    .on('mouseup', '.dividerDrag', function(evt) {
      startDrag = null;
      renderRink();
    })
    .on('mouseleave', '.dividerDrag', function(evt) {
      startDrag = null;
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
    classes[parentRow.index()].factor    = +$(this).attr('value');
    classes[parentRow.index()].factorSrc = 'input';
    $('input', $(this).closest('.input-group')).val($(this).attr('value')).focus();
    renderRink();
  });

  $('table').on('input', '.studentFactor', function() {
    var parentRow = $(this).closest('tr');
    classes[parentRow.index()].factor    = +$(this).val();
    classes[parentRow.index()].factorSrc = 'input';
    renderRink();
  });

  // Offer layout for download
  $('#downloadLink').click(function() {
      $(this).attr('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent($('.col-md-3').html()));
      $(this).click();
  });

  // Load a previously saved layout
  $('#loadLink').click(function() {
    var loader = $('<input />', {
      type: 'file'
    });
    loader.change(function(evt) {
      var file = evt.target.files[0];
      var reader = new FileReader();
      reader.onload = function(evt) {
        // Set displayed layout
        classes = [];
        var contents = evt.target.result;
        $('#rinkLayout').html(contents);
        $('tr').slice(2).remove();

        $('.classLabel').toArray().forEach(function(classSpace) {
          // Set class data
          var classData = $(classSpace);
          classes.push({'name':      classData.html(),
                        'students':  +classData.attr('data-students'),
                        'factor':    +classData.attr('data-factor'),
                        'factorSrc': classData.attr('data-factor-src')});

          // Set up class input
          var newRow = $('tbody tr').first().clone();
          $('.removeClass', newRow).prop('disabled', false);
          $('.className', newRow).val(classData.html());
          $('.studentNumber', newRow).val(classData.attr('data-students'));
          $('.studentFactor', newRow).val(classData.attr('data-factor'));
          $('tbody').append(newRow);
        });

        $('tbody tr').first().remove();
        $('.removeClass', $('tbody tr').first()).prop('disabled', true);
      };
      reader.readAsText(file);
    });
    loader.click();
  });

  // Allow layout clearing
  $('#clearLayout').click(function() {
    classes = [{'name': '', 'students': NaN, 'factor': 1.5, 'factorSrc': 'input'}];

    // Clean first row
    $('tr').slice(2).remove();
    $('.className').val('');
    $('.studentNumber').val('');
    $('.studentFactor').val('1.5');
    renderRink();
  });
});
