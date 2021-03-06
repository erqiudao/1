'use strict'

var _ = require('lodash')
var React = require('react')
var Router = require('react-router')
var objectAssign = require('object-assign')

var MapActionCreators = require('../actions/MapActionCreators')
var Store = require('../stores/Store')

var IndicatorSelector = React.createClass({

  displayName: 'IndicatorSelector',

  mixins: [ Router.State, Router.Navigation ],

  componentDidMount() {
    Store.addIndicatorChangeListener(this.handleStoreChange)
    this.setState({})
  },

  handleStoreChange() {
    this.setState({})
  },

  hanldeSelectChange(e) {
    var queries = this.getQuery()
    var _queries = objectAssign(queries, {indicator: e.target.value})

    this.replaceWith('app', {}, _queries)
    MapActionCreators.changeIndicator(e.target.value)
  },

  render() {
    var MenuItems, indicatorDescription
    var data = this.props.data
    var selected_indicator = Store.getSelectedIndicator()

    // after get the configs
    if (data.configs && data.configs.indicators && selected_indicator) {

      var indicators = data.configs.indicators
      var MenuItems = Object.keys(indicators)
        .filter(key => indicators[key].name)
        .map(key => ({ payload: key, text: indicators[key].name }))
        .map((data, index) => (<option key={index} value={data.payload}>{data.text}</option>))

      indicatorDescription = data.configs.indicators[selected_indicator].description

    } else {
      MenuItems = null
    }

    return (
      <section className='indicator'>
        <header className='select'>
          <select onChange={this.hanldeSelectChange} value={selected_indicator}>
            {MenuItems}
          </select>
        </header>
        <p className='description'>{indicatorDescription}</p>
      </section>
    )
  }

})

module.exports = IndicatorSelector