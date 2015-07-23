/*jslint nomen: true */
/*global mx, mxui, mendix, dojo, require, console, define, module */

require([
    'dojo/_base/declare', 'mxui/widget/_WidgetBase', 'dijit/_TemplatedMixin',
    'mxui/dom', 'dojo/dom', 'dojo/query', 'dojo/dom-prop', 'dojo/dom-geometry', 'dojo/dom-class', 'dojo/dom-style', 'dojo/on', 'dojo/_base/lang', 'dojo/text',
    'dojo/_base/array', 'dojo/dom-construct', 'dojo/text!iCheckCheckboxes/widget/template/CheckboxSelector.html'//, 'dojo/NodeList-traverse'
], function (declare, _WidgetBase, _TemplatedMixin, domMx, dom, domQuery, domProp, domGeom, domClass, domStyle, on, lang, text, array, domConstruct, widgetTemplate) {
	'use strict';
	// Declare widget's prototype.
	return declare('iCheckCheckboxes.widget.CheckboxSelector', [_WidgetBase, _TemplatedMixin], {
		// _TemplatedMixin will create our dom node using this HTML template.
		templateString: widgetTemplate,
		// General variables
		_wgtNode: null,
		_contextObj: null,
		_handles: null,

		// Extra variables
		_selectAllBox: null,
		_readonly: null,
		_firstTh: null,
		_referencePath : null,

		/**
		 * Mendix Widget methods.
		 * ======================
		 */
		constructor: function () {
			this._handles = [];
			this._readonly = false;
		},

		// PostCreate is fired after the properties of the widget are set.
		postCreate: function () {

			// Setup widgets
			this._setupWidget();
		},

		/**
		 * What to do when data is loaded?
		 */

		update: function (obj, callback) {
			// update
			console.debug('CheckboxSelector - update');

			this._contextObj = obj;

			if (this._contextObj === null) {

				// Sorry no data no show!
				domStyle.set(this.domNode, "visibility", "hidden");
				console.debug('CheckboxSelector  - update - We did not get any context object!');
			} else {
				domStyle.set(this.domNode, "visibility", "visible");
				
				this._readonly = this._contextObj.isReadonlyAttr(this._referencePath);

				// Subscribe to object updates.
				this._resetSubscriptions();

				// Load data
				this._loadData();
			}

			callback();

		},

		/**
		 * How the widget re-acts from actions invoked by the Mendix App.
		 */
		suspend: function () {
			//TODO, what will happen if the widget is suspended (not visible).
		},

		resume: function () {
			//TODO, what will happen if the widget is resumed (set visible).
		},

		enable: function () {
			//TODO, what will happen if the widget is enabled (not visible).
		},

		disable: function () {
			//TODO, what will happen if the widget is disabled (set visible).
		},

		unintialize: function () {},


		/**
		 * Extra setup widget methods.
		 * ======================
		 */
		_setupWidget: function () {
			console.debug('CheckboxSelector - setup widget');

			// To be able to just alter one variable in the future we set an internal variable with the domNode that this widget uses.
			this._wgtNode = this.domNode;
			
			this._referencePath = this.reference.split('/')[0];
			this._firstTh = domQuery('.first-th', this._wgtNode)[0];

			if (this.addSelectAll) {
				console.debug('addSelectAll');
				this._selectAllBox = domConstruct.create('input', {
					type: 'checkbox'
				});
                
                var iCheck = domConstruct.create('div', {
                    "class": "icheckbox_" + this.iCheckStyle + "-" + this.iCheckColor,
                    "id" : "icheck_selectall"
                })

				console.debug(this._selectAllBox);

				domConstruct.place(this._selectAllBox, this._firstTh);
                domConstruct.place(iCheck, this._firstTh, "last");
				
				//Add the onclick event on the SelectAll checkbox
				on(iCheck, 'click', lang.hitch(this, function (event) {

					var tbody = domQuery('tbody', this._wgtNode)[0];
					//toggle all checkboxes when the row is clicked
					this._selectAllBoxes(domQuery('input', tbody));
				}));
			}

		},

		// Attach events to newly created nodes.
		_setupEvents: function () {

			console.debug('CheckboxSelector - setup events');
			if (!this.readOnly && !this._readonly) {
				on(domQuery('tbody tr', this._wgtNode), 'click', lang.hitch(this, function (event) {
					if (event.target.tagName.toUpperCase() === "TD" || event.target.tagName.toUpperCase() === "DIV") {

						var box = "";
						var node = "";

						if (event.target.tagName.toUpperCase() === "TD") {
							box = event.target.parentNode.id.split("_").pop();
							node = event.target.parentElement.innerHTML;
						}
						else {
							box = event.currentTarget.id.split("_").pop();
							node = event.currentTarget.innerHTML;
						}

						//Evaluate if the value of the select all box needs to change
						this._evaluateSelectAllBox(box);
						
						this._setReference(box, node);
						this._execMf(this.onChangeMf, [this._contextObj.getGuid()]);
					} else {
						var row = domQuery(event.target).parent()[0];
					}
				}));
			} else {
				//disable all checkboxes
				var tbody = domQuery('tbody', this._wgtNode)[0];
				this._setDisabled(domQuery('input', tbody));
			}

		},


		/**
		 * Interaction widget methods.
		 * ======================
		 */
		_loadData: function () {
			console.debug('CheckboxSelector - Load data');
			this._clearValidations();

			//default fetch
			var refEntity = this.reference.split('/')[1],
				filters = {},
				xpath = '//' + refEntity;

			filters.sort = [[this.sortAttr, this.sortOrder]];
			if (this.limit > 0) {
				filters.amount = this.limit;
			}
			if (this.constraint) {
				xpath = '//' + refEntity + this.constraint.replace('[%CurrentObject%]', this._contextObj);
			}
			mx.data.get({
				xpath: xpath,
				filter: filters,
				callback: lang.hitch(this, function (objs) {
					this._fetchData(objs);
				})
			});

		},

		_setAsReference: function (guid) {
			console.debug('CheckboxSelector - set as reference');
			this._contextObj.addReferences(this._referencePath, [guid]);
		},

		_execMf: function (mf, guids) {
			if (mf && guids) {
				console.debug('CheckboxSelector - Execute MF with guids: ', guids);
				mx.data.action({
					params: {
						applyto: 'selection',
						actionname: mf,
						guids: guids
					},
					callback: lang.hitch(this, function (obj) {
						//TODO what to do when all is ok!
					}),
					error: function (error) {
						console.debug(error.description);
					}
				}, this);
			}
		},

		/**
		 * Fetching Data & Building widget
		 * ======================
		 */
		_buildTemplate: function (rows, headers) {
			//TODO: Load template for each object
			console.debug('CheckboxSelector - Build Template');

			var tbody = domQuery('tbody', this._wgtNode)[0],
				thead = domQuery('thead tr', this._wgtNode)[0];
			//empty the table
			domConstruct.empty(tbody);

			domConstruct.place(this._firstTh, thead, 'first');

			for( var i = 0; i<headers.length;i++ ) {
				var headerPos=i+1;
				if( thead.children.length > headerPos ) 
					thead.children[headerPos].innerHTML = headers[i];
				else {
					var th = domConstruct.create('th', {
						innerHTML: headers[i]
					});            
					domConstruct.place(th, thead, 'last');
				} 
			}

			array.forEach(rows, lang.hitch(this, function (rowData) {

				var row = domConstruct.create('tr', {
				        id: this.domNode.id + '_' + rowData.id
				    }),
				    checkboxtd = domConstruct.create('td', {
				        "style": "width: 1%;"
				    }),
				    iCheck = domConstruct.create('div', {
				        "class": "icheckbox_" + this.iCheckStyle + "-" + this.iCheckColor,
				        "id": "chk_" + rowData.id
				    }),
				    input = domConstruct.create('input', {
				        type: 'checkbox',
				        value: rowData.id
				    });

                domConstruct.place(iCheck, checkboxtd);
                domConstruct.place(input, iCheck);
				domConstruct.place(checkboxtd, row);
                        
				array.forEach(rowData.data, function (value) {
					var td = domConstruct.create('td', {
						innerHTML: value
					});
					domConstruct.place(td, row, 'last');
				});
				domConstruct.place(row, tbody);
			}));

			this._setReferencedBoxes(this._contextObj.getReferences(this.reference.split('/')[0]));

			// Setup events
			this._setupEvents();
		},

		_fetchData: function (objs) {
			var data = [],
				finalLength = objs.length * this.displayAttrs.length;

			console.debug('CheckboxSelector - fetched data');

			array.forEach(objs, lang.hitch(this, function (obj) {
				array.forEach(this.displayAttrs, lang.hitch(this, function (attr, index) {
					obj.fetch(attr.displayAttr, lang.hitch(this, function (value) {
						if (typeof value === 'string') {
							value = mxui.dom.escapeString(value);
							value = value.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, ' Warning! Script tags not allowed. ');
						}
						if (attr.currency !== "None") {
							value = this._parseCurrency(value, attr);
						}

						data.push({
							'obj': obj.getGuid(),
							'index': index,
							'value': value,
							'header': attr.header
						});
						if (data.length === finalLength) {
							this._processData(data);
						}
					}));
				}));
			}));
		},

		_processData: function (data) {
			var rowObjs = [],
				rows = [],
				headers = [];

			//filter doubles
			array.forEach(data, function (item) {
				if (array.indexOf(rowObjs, item.obj) === -1) {
					rowObjs.push(item.obj);
				}
			});

			array.forEach(rowObjs, function (obj) {
				var rowData = [],
					row = {};
				row.id = obj;
				array.forEach(data, function (item) {
					if (obj === item.obj) {
						rowData.splice(item.index, 0, item.value);
						if (array.indexOf(headers, item.header) === -1) {
							headers.splice(item.index, 0, item.header);
						}
					}
				});
				row.data = rowData;
				array.forEach(headers, function (header) {
					if (obj === header.id) {
						row.header = header.header;
					}
				});
				rows.push(row);
			});
			this._buildTemplate(rows, headers);
		},
		
		/**
		 * Evaluate if the value of the select all box needs to change
		 */
		_evaluateSelectAllBox: function ( box ) {

			var chk = domQuery("#chk_" + box)[0];
			var selAll = domQuery("#icheck_selectall")[0];

			if(chk.className.toUpperCase().indexOf("CHECKED") > -1) {
				if (this.addSelectAll && selAll.className.toUpperCase().indexOf("CHECKED") > -1) 
					domClass.remove(selAll, "checked");
			}
		},
		
		_setDisabled: function (boxes) {
			array.forEach(boxes, function (box) {
				var chkBox = domQuery("#chk_" + box.defaultValue)[0];
				domClass.add(chkBox, "disabled");
				domClass.add(chkBox.parentElement, "defaultCursor");
				domClass.add(chkBox.parentElement.nextSibling, "defaultCursor");
			});
		},

		_selectAllBoxes: function (boxes) {
			console.debug('CheckboxSelector - (De)select all checkboxes');
			
            var selAll = domQuery("#icheck_selectall")[0];

			if (selAll.className.toUpperCase().indexOf("CHECKED") > -1) {
				array.forEach(boxes, lang.hitch(this, function (box) {
					this._contextObj.removeReferences(this._referencePath, box.defaultValue);
				}));
				domClass.remove(selAll, "checked");
			} else {
				array.forEach(boxes, lang.hitch(this, function (box) {
					this._setAsReference(box.defaultValue);
				}));
				domClass.add(selAll, "checked");
			}
		},

		_setReferences: function (boxes) {
			console.debug('CheckboxSelector - set references');
			var self = this,
				refguids = this._contextObj.getReferences(this.reference.split('/')[0]),
				id = null;

			
			boxes.forEach( lang.hitch(this, function (box) {
				this._setReference(box);
			}));

			this._execMf(this.onChangeMf, [this._contextObj.getGuid()]);
		},
		
		_setReference : function (box, node) {

			if (node.toUpperCase().indexOf("CHECKED") > -1) {
                this._contextObj.removeReferences(this._referencePath, box);
                domClass.remove(domQuery("#chk_" + box)[0], "checked");
			} else {
				this._setAsReference(box);
                domClass.add(domQuery("#chk_" + box)[0], "checked");				
			}	
		},
		
		
		/**
		 * Helper functions
		 * ======================
		 */

		_setReferencedBoxes: function (guids) {
			
			var boxes = [];
			
			var inputNodes = domQuery('input[value]', this.domNode);
			
			array.forEach(inputNodes, lang.hitch(this, function(inputNode) {
				if(guids.indexOf(inputNode.value) > -1) {
					inputNode.checked = true;
                    domClass.add(domQuery("#chk_" + inputNode.value)[0], "checked");
				}
				else if(inputNode.checked === true) {
					inputNode.checked = false;
                    domClass.remove(domQuery("#chk_" + inputNode.value)[0], "checked");
					this._evaluateSelectAllBox(inputNode.defaultValue);
				}
			}));
		},

		_parseCurrency: function (value, attr) {
			var currency = value;
			switch (attr.currency) {
			case 'Euro':
				currency = '&#8364 ' + mx.parser.formatValue(value, "currency", {
					places: attr.decimalPrecision
				});
				break;
			case 'Dollar':
				currency = '&#36 ' + mx.parser.formatValue(value, "currency", {
					places: attr.decimalPrecision
				});
				break;
			case 'Yen':
				currency = '&#165 ' + mx.parser.formatValue(value, "currency", {
					places: attr.decimalPrecision
				});

				break;
			case 'Pound':
				currency = '&#163 ' + mx.parser.formatValue(value, "currency", {
					places: attr.decimalPrecision
				});

				break;
			default:
				console.debug('Error: Currency type not found');
				break;
				// type not found
			}
			return currency;
		},

		_checkValue: function (obj, value, attr) {
			//TODO: ENUM captions
		},
		
		_resetSubscriptions: function () {
			var entHandle = null,
				objHandle = null,
				attrHandle = null,
				validationHandle = null;

			// Release handles on previous object, if any.
			if (this._handles) {
				this._handles.forEach(function (handle, i) {
					mx.data.unsubscribe(handle);
				});
			}

			if (this._contextObj) {
				entHandle = this.subscribe({
					entity: this.reference.split('/')[1],
					callback: lang.hitch(this, function () {
						this._loadData();
					})
				});

				objHandle = this.subscribe({
					guid: this._contextObj.getGuid(),
					callback: lang.hitch(this, function (guid) {
						this._loadData();
					})
				});

				attrHandle = this.subscribe({
					guid: this._contextObj.getGuid(),
					attr: this.reference.split('/')[0],
					callback: lang.hitch(this, function (guid, attr, attrValue) {
						
						this._setReferencedBoxes(attrValue);
					})
				});

				validationHandle = mx.data.subscribe({
					guid: this._contextObj.getGuid(),
					val: true,
					callback: lang.hitch(this, this._handleValidation)
				});

				this._handles = [entHandle, objHandle, attrHandle, validationHandle];
			}
		},

		_handleValidation: function (validations) {

			this._clearValidations();

			var val = validations[0],
				msg = val.getReasonByAttribute(this.reference.split('/')[0]);

			if (this.readOnly) {
				val.removeAttribute(this.reference.split('/')[0]);
			} else {
				if (msg) {
					this._addValidation(msg);
					val.removeAttribute(this.reference.split('/')[0]);
				}
			}
		},

		_clearValidations: function () {
			domConstruct.destroy(this._alertdiv);
		},

		_addValidation: function (msg) {
			this._alertdiv = domConstruct.create("div", {
				class: 'alert alert-danger',
				innerHTML: msg
			});

			this.domNode.appendChild(this._alertdiv);

		}
	});
});