'use strict'

var _ = require('lodash')
var numeral = require('numeral')
var d3 = require('d3')

var MapUtils = {

  /**
   * Check n if is an integer
   */
  isInt(n) {
    return n % 1 === 0
  },

  /**
   * Given a value, to calculate the color value from the current indicator and confif data
   */
  getNumberColor(value, configs, meta, selected_indicator) {
    var min = meta.indicators[selected_indicator].min_value
    var max = meta.indicators[selected_indicator].max_value
    var colors = configs.ui.choropleth
    var steps = configs.ui.choropleth.length
    var step = (max - min)/steps
    var colorIndex = ((value - min)/step).toFixed()

    if (colorIndex <= 0) { colorIndex = 0 }
    if (colorIndex >= steps) { colorIndex = steps - 1 }

    return colors[colorIndex]

  },

  getSelectColor(value, configs, selected_indicator) {
    var d = configs.indicators[selected_indicator].mapping[value]

    var max = _.max(configs.indicators[selected_indicator].mapping)
    var min = _.min(configs.indicators[selected_indicator].mapping)
    var start = configs.ui.choropleth.start
    var end = configs.ui.choropleth.end

    return MapUtils.getColorCode(min, max, start, end, d)
  },

  /**
   * A simple template helper function to genrerate markup from data
   */
  compileTemplate(tpl, data) {
    var re = /{{(.+?)}}/g,
      reExp = /(^( )?(var|if|for|else|switch|case|break|{|}|;))(.*)?/g,
      code = 'with(obj) { var r=[];\n',
      cursor = 0,
      result,
      match
    var add = function(line, js) {
      js? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n') :
        (code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
      return add;
    }
    while(match = re.exec(tpl)) {
      add(tpl.slice(cursor, match.index))(match[1], true);
      cursor = match.index + match[0].length;
    }
    add(tpl.substr(cursor, tpl.length - cursor));
    code = (code + 'return r.join(""); }').replace(/[\r\t\n]/g, '');
    try { result = new Function('obj', code).apply(data, [data]); }
    catch(err) { console.error("'" + err.message + "'", " in \n\nCode:\n", code, "\n"); }
    return result
  },

  /**
   * Normalize country name
   */
  getCountryNameId(name) {
    var ALLOWED_CHARS = '0123456789abcdefghijklmnopqrstuvwxyz_'

    return name
      .toLowerCase()
      .trim()
      .replace(' ', '_')
      .split('')
      .filter(function(char) {
        if (_.contains(ALLOWED_CHARS, char)) {
          return char
        }
      })
      .join('')
  },

  /**
   * Center the given country on the map
   */
  centerOnCountry(layer, map) {
    map.fitBounds(layer.getBounds())
    // layer.setStyle({ color: 'black' })
  },

  /**
   * Get Legend Html with the selected Indicator
   */
  getLegendHTML(configs, global, selected_indicator) {
    var indicatorName = configs.indicators[selected_indicator].name

    var labels = [], from, to, color
    var min = global.meta.indicators[selected_indicator].min_value.toFixed()
    var max = global.meta.indicators[selected_indicator].max_value.toFixed()
    var colors = configs.ui.choropleth
    var steps = configs.ui.choropleth.length
    var step = ((max - min)/steps).toFixed()

    for (var i = 0; i < steps; i++) {
      if (i == 0) {
        from = parseInt(min)
        to = parseInt(from) + parseInt(step)
      } else {
        from = parseInt(to + 1)
        to = parseInt(from) + parseInt(step)
      }
      labels.push(`<li><span class='swatch' style='background:${colors[i]}'></span>${numeral(from).format('0.0a')}${' &ndash; '}${numeral(to).format('0.0a')}</li>`)
    }

    return `<ul class='legend-list'>${labels.join('')}</ul>`
    // var steps = configs.ui.choropleth.length
    // var step = ((max - min)/steps).toFixed()

    // var _color = d3.scale.log()
    //   .domain([min, max])
    //   .range(["hsl(62,100%,90%)", "hsl(228,30%,20%)"])
    //   .interpolate(d3.interpolateHcl)

    // for (var i = 0; i < steps; i++) {
    //   if (i == 0) {
    //     from = parseInt(min)
    //     to = parseInt(from) + parseInt(step)
    //     color = _color((from + to)/2)
    //   } else {
    //     from = parseInt(to + 1)
    //     to = parseInt(from) + parseInt(step)
    //     color = _color((from + to)/2)
    //   }
    //   labels.push(`<li><span class='swatch' style='background:${color}; opacity:0.7'></span>${numeral(from).format('0.0a')}${'&ndash;'}${numeral(to).format('0.0a')}</li>`)
    // }

    // return `<ul class='legend-list'>${labels.join('')}</ul>`
  },

  /**
   * Add a tooltip
   */
  addTooltip(map, layer, popup, indicators, selected_indicator, configs, selected_year, e) {

    var latlng = e ? e.latlng : layer.getBounds().getCenter()

    popup.setLatLng(latlng)

    var value = 'No data'
    var countryName = MapUtils.getCountryNameId(layer.feature.properties['ISO_NAME'])

    if (countryName in indicators && indicators[countryName][selected_indicator] !== undefined) {
      var tooltipTemplate = configs.indicators[selected_indicator].tooltip

      // data with years
      if (configs.indicators[selected_indicator].years.length) {
        var value = indicators[countryName][selected_indicator].years[selected_year]
        if (value) {
          if (!MapUtils.isInt(value)) {
            value = indicators[countryName][selected_indicator].years[selected_year].toFixed(2)
            value = numeral(value).format('0.000')
          }
          value = MapUtils.compileTemplate(tooltipTemplate, {currentIndicator: value})
        }
      } else {
        if(indicators[countryName][selected_indicator]) {
          value = indicators[countryName][selected_indicator]
          if (value && !MapUtils.isInt(value)) {
            value = numeral(value.toFixed(2)).format('0.000')
          }
          value = MapUtils.compileTemplate(tooltipTemplate, {currentIndicator: value})
        }
      }
    }

    popup.setContent('<div class="marker-title">' + layer.feature.properties['ISO_NAME'] + '</div>' + value)

    if (!popup._map) popup.openOn(map)
    if (!L.Browser.ie && !L.Browser.opera) layer.bringToFront()
  }
}

module.exports = MapUtils