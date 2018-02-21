/*!
 * Project: uni-test
 * File:    assets/js/app/uni.tests.js
 * Author:  Baltrushaitis Tomas <tbaltrushaitis@gmail.com>
 * Created: 2018-02-20
 */

'use strict';

let idTest
  , idStage
  , areaTest
  , listScales = {}
  , listContextual = ['primary', 'success', 'info', 'warning', 'danger']
  , questionIndex = 0
  , dataAll
  , dataTest
  , dataStage
  , listQuestions
  , countQuestions
  , questionsContainer
;

function loadTestData (url, testId, stageId, testContainer) {
  $.getJSON(url, function (data, textStatus) {
    idTest = testId;
    idStage = stageId;
    areaTest = testContainer;
    listScales = {};
    questionIndex = 0;

    dataAll = data;
    dataTest = (_.where(dataAll.collection_tests, {id: idTest}))[0];
    dataStage = (_.where(dataTest.stages, {id: idStage}))[0];
    listQuestions = dataStage.questions;
    countQuestions = _.size(listQuestions) - 1;

    _.each(dataTest.scales, function (scaleObj, i) {
      listScales[_.keys(scaleObj)[0]] = 0;
    })

    questionsContainer = renderTestHTML();
    checkNextStep();
  })
  .done(function () {
    //console.log('done');
  })
  .fail(function () {
    console.log('fail');
  })
  .always(function () {
    //console.log('finally');
  });
};


function checkNextStep () {
  if (questionIndex <= countQuestions) {
    switch (listQuestions[questionIndex].input_type) {
      case 'radio':
        renderQuestionRadio(questionIndex);
        break;
      case 'checkbox':
        renderQuestionCheckBoxes(questionIndex);
        break;
      default:
        renderQuestionRadio(questionIndex);
    }
  }else{
    renderStageResults();
  };
};


function renderTestHTML () {
  var oTPanel        = $('<div />').addClass('panel panel-primary'),
      oTPanelHeading = $('<div />').addClass('panel-heading'),
      oTPanelTitle   = $('<div />').addClass('panel-title').html(dataTest.desc),
      oTPanelBody    = $('<div />').addClass('panel-body');

  oTPanel.append(oTPanelHeading.append(oTPanelTitle)).append(oTPanelBody);
  areaTest.append(oTPanel);
  return oTPanelBody;
};


function renderQuestionRadio (qIndex) {
  var qObject = listQuestions[qIndex],
      q_answers = qObject.answers,
      keyQuestion = dataTest.key + dataStage.key + qObject.key,
      progress = (qIndex) * 100 / _.size(listQuestions),
      oQPanel = $('<div />').addClass('panel panel-info')
                  .attr({id: keyQuestion, name: keyQuestion})
                  .css({display: 'none'}),
      oQPanelHeading = $('<div />').addClass('panel-heading'),
      oQPanelTitle = $('<h4 />').addClass('panel-title').html(qObject.caption),
      oQPanelBody = $('<div />').addClass('panel-body'),
      oQFooterTip = $('<div />').addClass('label label-success').html(qObject.tip),
      oQPanelFooter = $('<div />').addClass('panel-footer'),
      oQProgress    = $('<div />').addClass('progress progress-striped active')
                        .append(
                          $('<div />').addClass('progress-bar progress-bar-warning')
                            .attr({
                                'role':         'progressbar'
                              , 'aria-valuenow': progress
                              , 'aria-valuemin': 0
                              , 'aria-valuemax': 100
                            })
                            .html(progress + '%')
                            .css({width: progress + '%'})
                        ),
      oQFieldSet = $('<fieldset />').append($('<legend />').html(qObject.text)),
      btnSubmit  = $('<button />').addClass('btn btn-sm btn-primary submit-answer')
                    .attr({type: 'submit'})
                    .html('Continue');

  _.each(q_answers, function (answerObj, i) {
    var keyAnswer = keyQuestion + answerObj.key
      , a_label   = $('<label />')
                      .attr({for: keyAnswer})
                      .html(answerObj.caption + '&nbsp;')
      , a_text = $('<label />')
                  .attr({for: keyAnswer})
                  .html('&nbsp;' + answerObj.text)
      , a_element = $('<input />').addClass('answer')
                      .attr({
                        type:      qObject.input_type,
                        name:      keyQuestion,
                        id:        keyAnswer,
                        value:     answerObj.score,
                        id_answer: answerObj.id_answer - 1
                      });

    a_label.append(a_element).append(a_text);
    oQFieldSet.append(a_label).append($('<br />'));
  });

  oQPanelBody.append(oQFieldSet).append(btnSubmit.hide());
  console.log('btnSubmit.height = ', btnSubmit.height(), btnSubmit.offset().top);
  oQPanel.append(oQPanelHeading.append(oQPanelTitle))
    .append(oQPanelBody)
    .append(oQPanelFooter.append(oQProgress))
    .hide();
  questionsContainer.append(oQPanel);
  $(oQPanel).show('blind', 500);
  oQPanelBody.css({height: oQPanelBody.height() + Math.abs(btnSubmit.height()) * 3});

  $('#' + keyQuestion + ' .answer').on('change', this, function (e) {
    $('#' + keyQuestion + ' .submit-answer').show('explode', 500); // 'fade', 'explode'
  });

  $('#' + keyQuestion + ' .submit-answer').on('click', this, function (e) {
    var choice = $('#' + keyQuestion + ' input[type=radio]:checked').attr('id_answer'),
        scaleUpdate = q_answers[choice].scale;
    oQPanelFooter.html('Option chosen: ' + q_answers[choice].caption);
    $(this).hide('explode', 500);
    $('#' + keyQuestion + ' .answer').attr('disabled', true);
    $('#' + keyQuestion).slideUp(500).remove(); // remove answered
    listScales[scaleUpdate] += q_answers[choice].score;
    questionIndex++;

    checkNextStep();
  });
};


function renderStageResults () {
  var listScores = _.values(listScales)
    , scaleKeys = _.keys(listScales)
    , maxScore = _.max(listScores)
    , indexScale = _.indexOf(listScores, maxScore)
    , scaleKey = scaleKeys[indexScale]
    , scaleData = ($(dataTest.scales)[indexScale])[scaleKey];

  var oResultPanel = $('<div />').addClass('panel panel-success')
                      .attr({id: dataStage.key, nam: dataStage.key})
                      .css({display: 'none'}),
      oResultPanelHeading = $('<div />').addClass('panel-heading'),
      oResultPanelTitle = $('<h4 />').addClass('panel-title').html(dataStage.name),
      oResultPanelBody = $('<div />').addClass('panel-body'),
      oResultPanelFooter = $('<div />').addClass('panel-footer'),
      oResultProgress = $('<div />').addClass('progress progress-striped')
                          .append(
                            $('<div />').addClass('progress-bar progress-bar-success')
                              .attr({
                                  'role':         'progressbar'
                                , 'aria-valuenow': 100
                                , 'aria-valuemin': 0
                                , 'aria-valuemax': 100
                              })
                              .css({width: 100 + '%'})
                              .html(100 + '%')
                          ),
      oResultFieldSet = $('<fieldset />').append($('<legend />').html('Ваша характеристика:')),
      oResultRank = $('<div />').addClass('alert alert-warning')
                      .html(
                        $('<p />').append($('<strong />').html(scaleData.figure))
                          .append($('<span />').html(' - ' + scaleData.explanation))
                      ),
      btnSubmit = $('<button />').addClass('btn btn-sm btn-primary submit-results')
                    .attr({type: 'submit'})
                    .html('Restart');
  oResultPanelBody.append(oResultFieldSet)
    .append(oResultRank)
    .append(btnSubmit);
  oResultPanel.append(oResultPanelHeading.append(oResultPanelTitle))
    .append(oResultPanelBody)
    .append(oResultPanelFooter.append(oResultProgress))
    .hide();
  questionsContainer.append(oResultPanel);
  $(oResultPanel).show('fold', 500); // "fold", "clip", "blind",

  $('#' + dataStage.key + ' .submit-results').on('click', this, function (e) {
    $('#' + dataStage.key).hide('drop');
    location.reload(true);
  });

};


function loadTestStep (url, StepContainer) {
  $.getJSON(url, function (data, textStatus) {
    areaStep = StepContainer;
    dataAll = data;
    testScales = {};
    renderTestStep();
  })
  .done(function () {
    //console.log('done');
  })
  .fail(function () {
    console.log('fail');
  })
  .always(function () {
    //console.log('finally');
  });
};


function renderTestStep () {
  var q_id = dataAll.uni_test_step.id_question,
      q_text = dataAll.uni_test_step.id_step + '. ' + dataAll.uni_test_step.question_text,
      q_answers = dataAll.uni_test_step.answers;

  var oForm = $('<form id="form_question_' + q_id + '" name="form_question_' + q_id + '" role="form" />'),
      oPanel = $('<div class="panel panel-primary" />'),
      oPanelHeading = $('<div class="panel-heading" />'),
      oPanelTitle = $('<div class="panel-title" />').html(dataAll.uni_test_step.skill),
      oPanelBody = $('<div class="panel-body" />'),
      oPanelFooter = $('<div class="panel-footer" />').html('<span class="label label-success">Tip:</span> ' + dataAll.uni_test_step.tip);

  var oFieldSet = $('<fieldset />').append($('<legend />').html(q_text)),
      btnSubmit = $('<button type="submit" class="btn btn-primary submit-answer">Submit</button>').css({display: 'none'});

  _.each(q_answers, function (answerObj, i) {
    var a_label = $('<label for="' + answerObj.id_answer + '" />').html(answerObj.caption + '&nbsp;'),
        a_text = $('<label for="' + answerObj.id_answer + '" />').html('&nbsp;' + answerObj.text),
        a_element = $('<input class="answer" type="' + answerObj.input_type + '" name="q_' + q_id + '[]" id="' + answerObj.id_answer + '" value="' + answerObj.score + '" />');

    a_label.append(a_element).append(a_text);
    oFieldSet.append(a_label).append($('<br />'));
    testScales[answerObj.scale] = 0;
  });

  areaStep.wrap(oForm);
  oPanelBody.append(oFieldSet).append(btnSubmit);
  oPanel.append(oPanelHeading.append(oPanelTitle)).append(oPanelBody).append(oPanelFooter);
  areaStep.append(oPanel);

  $('.answer').change(function () {
    $('.submit-answer').fadeIn();
  });

  $('.submit-answer').click(function (e) {
    var choice = $('input[type=radio]:checked').attr('id') - 1,
        scaleUpdate = q_answers[choice].scale;
    oPanelFooter.html('Answer chosen: ' + q_answers[choice].caption);
    $(this).fadeOut();
    $('input[type=radio].answer').attr('disabled', true);
    testScales[scaleUpdate] += q_answers[choice].score;
  });

  $('form').submit(function (event) {
    event.preventDefault();
  });

};
