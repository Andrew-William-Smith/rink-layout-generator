var classes = [{'name': '', 'students': NaN, 'factor': 1.5, 'factorSrc': 'input'}];
var dragDivides, rinkSVG, scalePoint, startDrag;
var rink, rinkBounds, yPerUnit;

// Compensate for SVG autoscaling in mouse coordinates
function svgCoords(evt) {
  scalePoint.x = evt.clientX;
  scalePoint.y = evt.clientY;
  return scalePoint.matrixTransform(rinkSVG[0].getScreenCTM().inverse());
}

function renderTextNode(classInfo, split, yCoord) {
  // Basic properties
  var node = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  switch(split) {
    case 0:    // No split
      node.innerHTML = classInfo.name;
      break;
    case 1:    // Left sector
      node.innerHTML = classInfo.name.split('/')[0];
      break;
    case 2:    // Right sector
      node.innerHTML = classInfo.name.split('/')[1];
      break;
  }

  node.style = 'font-family: sans-serif; font-size: 15px; font-weight: 600';
  // Hack to get node size before display
  var nodeTemp = $(node).appendTo(rinkSVG);
  var nodeBox = nodeTemp[0].getBBox();
  nodeTemp.remove();

  // Properly center node, add split information
  node.setAttribute('class', 'classLabel');
  switch(split) {
    case 0:    // No split
      node.setAttribute('x', ((rinkBounds.x + (rinkBounds.x + rinkBounds.width)) / 2) - (nodeBox.width / 2));
      break;
    case 1:    // Left sector
      node.setAttribute('x', ((rinkBounds.x + (rinkBounds.x + rinkBounds.width / 2)) / 2) - (nodeBox.width / 2));
      node.setAttribute('data-split', 'left');
      break;
    case 2:    // Right sector
      node.setAttribute('x', ((rinkBounds.x + (rinkBounds.x + (3/2) * rinkBounds.width)) / 2) - (nodeBox.width / 2));
      node.setAttribute('data-split', 'right');
      break;
  }
  node.setAttribute('y', (yCoord / 2) + (nodeBox.height / 2));

  // Data for loading
  node.setAttribute('data-students', classInfo.students);
  node.setAttribute('data-factor', classInfo.factor);
  node.setAttribute('data-factor-src', classInfo.factorSrc);
  rinkSVG.append(node);
}

function renderRink() {
  var totalSpaces = 0;
  classes.forEach(function(space) {
    if (!isNaN(space.students)) space.allotment = space.students * space.factor;
    else space.allotment = 0;
    if (space.allotment < 5 && space.factorSrc === 'input') space.allotment = 5;
    totalSpaces += space.allotment;
  });

  rinkSVG = $('svg');
  scalePoint = rinkSVG[0].createSVGPoint();

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

      // Add title: no division
      if (currentClass.name.indexOf('/') == -1) {
        renderTextNode(currentClass, 0, (previousLineY + newLineY));
      }
      // Add title and split line
      else {
        renderTextNode(currentClass, 1, (previousLineY + newLineY));
        renderTextNode(currentClass, 2, (previousLineY + newLineY));

        var splitLine = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        splitLine.setAttribute('class', 'splitDivider');
        splitLine.setAttribute('height', newLineY - previousLineY);
        splitLine.setAttribute('width', 2);
        splitLine.setAttribute('x', (rinkBounds.x + (rinkBounds.x + rinkBounds.width)) / 2);
        splitLine.setAttribute('y', previousLineY);
        rinkSVG.append(splitLine);
      }

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

  // Allow dragging of class dividers: faster than binding to each drag handle
  rinkSVG.off()
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
    classes.splice(parentRow.index() + 1, 0, {'name': '', 'students': NaN, 'factor': 1.5, 'factorSrc': 'input'});
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
    // Remove drag handles
    var exportSVG = $('.col-md-3').html().replace(/<rect class="dividerDrag" id="drag\d*?" .*?<\/rect>/g, '');
    $(this).attr('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(exportSVG));
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
          if (classData.attr('data-split') == 'right') {
            var combinedName = classes[classes.length - 1].name + '/' + classData.html();
            classes[classes.length - 1].name = combinedName;
            $('.className:last').val(combinedName);
          }
          else {
            classes.push({'name':      classData.html(),
                          'students':  +classData.attr('data-students'),
                          'factor':    +classData.attr('data-factor'),
                          'factorSrc': classData.attr('data-factor-src') == 'undefined' ? 'input' : classData.attr('data-factor-src')});

            // Add new input row
            var newRow = $('tbody tr').first().clone();
            $('.removeClass', newRow).prop('disabled', false);
            $('.className', newRow).val(classData.html());
            $('.studentNumber', newRow).val(classData.attr('data-students'));
            $('.studentFactor', newRow).val(parseFloat(classData.attr('data-factor')).toFixed(2));
            $('tbody').append(newRow);
          }
        });

        $('tbody tr').first().remove();
        $('.removeClass', $('tbody tr').first()).prop('disabled', true);
        renderRink();
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
