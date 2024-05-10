sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/m/library",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/Fragment",
	'sap/ui/export/Spreadsheet',
	"sap/ui/export/library"
], function (Controller, UIComponent, mobileLibrary, JSONModel, MessageBox, Filter, FilterOperator, Fragment, Spreadsheet, exportLibrary) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;

	return Controller.extend("sto.controller.BaseController", {
		/**
		 * Convenience method for accessing the router.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function () {
			return UIComponent.getRouterFor(this);
		},

		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function (sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Getter for the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onShareEmailPress: function () {
			var oViewModel = (this.getModel("objectView") || this.getModel("worklistView"));
			URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},
		_onValueHelpRequest: function (oInput) {
			if (oInput !== "Close" && oInput !== "Destroy") {
				this._oInput = oInput;
				var aCols = [];
				var aFilterItems = [];

				this._oF4ValueHelpInput = this._oInput;
				this._oInput.setValue("");
				var sId = this._oF4ValueHelpInput.getId();
				var iInd = sId.search("input");
				if (iInd < 0) {
					return;
				}
				this._oF4ValueHelpTable = sId.split("input")[1].split("-")[0];
				this._onSetSearchHelpDetails(this._oF4ValueHelpTable);

				this._oInput.getAggregation("customData").forEach(function (oCustomData) {
					if (oCustomData.getKey().includes("column")) {
						switch (oCustomData.getValue()) {
							case "Key":
								var sLabel = this.oHelpModel.getData().Key;
								break;
							case "Name":
								var sLabel = this.oHelpModel.getData().Name;
								break;
							default:
						}
						aCols.push({
							label: sLabel,
							template: oCustomData.getValue()
						});
					} else if (oCustomData.getKey().includes("filter")) {
						var aParts = oCustomData.getValue().split("|");
						aFilterItems.push({
							label: this.oHelpModel.getData().Key,
							path: aParts[0],
							type: aParts[0],
							items: aParts[2]
						});

						aFilterItems.push({
							label: this.oHelpModel.getData().Name,
							path: aParts[1],
							type: aParts[1],
							items: aParts[2]
						});
					}
				}.bind(this));
				aCols.push({
					label: "",
					template: "_key",
					width: "0rem"
				});
				aCols.push({
					label: "",
					template: "_all",
					width: "0rem"
				});
				this.oColModel = new JSONModel({
					cols: aCols
				});

				this._oValueHelpDialog = sap.ui.xmlfragment("sto.fragment.ValueHelpDialog", this);
				this.getView().addDependent(this._oValueHelpDialog);
				var oFilterBar = this._oValueHelpDialog.getFilterBar();

				aFilterItems.forEach(function (oFilterItem) {
					var oFilterControl;
					switch (oFilterItem.type) {
						case "Date":
							oFilterControl = new sap.m.DateRangeSelection(oFilterItem.type + oFilterItem.path, {
								name: oFilterItem.path
							});
							break;
						case "Select":
							oFilterControl = new sap.m.Select(oFilterItem.type + oFilterItem.path, {
								name: oFilterItem.path
							});
							oFilterItem.items.split(";").forEach(function (oSelectItem) {
								var aPair = oSelectItem.split(",");
								oFilterControl.addItem(new sap.ui.core.Item({
									key: aPair[0],
									text: this.getResourceBundle().getText(aPair[1])
								}));
							}.bind(this));
							break;
						default:
							if (oFilterItem.items) {
								this._sValueHelpKey = oFilterItem.path;
								var oProp = {
									name: oFilterItem.path,
									showValueHelp: true,
									valueHelpRequest: this.onValueHelpRequestDeep.bind(this)
								};
							} else {
								oProp = {
									name: oFilterItem.path
								};
							}
							oFilterControl = new sap.m.Input(oFilterItem.type + oFilterItem.path, oProp);
					}
					oFilterBar.addFilterGroupItem(new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "__$INTERNAL$",
						name: oFilterItem.path,
						label: oFilterItem.label,
						visibleInFilterBar: true
					}).setControl(oFilterControl));
				}.bind(this));

				this._oValueHelpDialog.getTableAsync().then(function (oTable) {
					oTable.setModel(this.oHelpModel);
					oTable.setModel(this.oColModel, "columns");

					oTable.setSelectionMode("Single");


					if (oTable.bindRows) {
						oTable.bindAggregation("rows", "/list");
					}

					this._oValueHelpDialog.update();
				}.bind(this));

				this._oValueHelpDialog.setSupportMultiselect(false);


				this._oValueHelpDialog.setTokens(this._oInput.getValue());

			}
			return this._oValueHelpDialog;

		},
		_onSearchValueHelp: function (oEvent) {

			sap.ui.core.BusyIndicator.show();
			var aFilters = [];

			this._oF4ValueHelpInput = this._oInput;
			this._oInput.setValue("");
			var sId = this._oF4ValueHelpInput.getId();
			var iInd = sId.search("input");
			if (iInd < 0) {
				return;
			}
			this._oF4ValueHelpTable = sId.split("input")[1].split("-")[0];
			//Commenting Type filter 
			//aFilters.push(new Filter("Type", FilterOperator.EQ, this._oF4ValueHelpTable));

			switch (this._oF4ValueHelpTable) {
				case "ContractItem":
					var sData = this.getView().getModel("SalesOrder").getData();
					aFilters.push(new Filter("Filter1", FilterOperator.EQ, sData.ContractNumber));
					break;
				default:
					break;
			}

			this._oInput.getAggregation("customData").forEach(function (oCustomData) {
				if (oCustomData.getKey().includes("param")) {
					this._objectContainer = this.getModel("objectView").getProperty(this._getItemBindingPath(oEvent.getSource()));
					var aParts = oCustomData.getValue().split("|");
					if (this._objectContainer[aParts[1]]) {
						aFilters.push(new Filter(aParts[0], FilterOperator.EQ, this._objectContainer[aParts[1]]));
					}
				}
			}.bind(this));
			if (oEvent !== null) {
				var aSelectionSet = oEvent.getParameter("selectionSet");
				aSelectionSet.forEach(function (oControl) {
					if (oControl.getId().includes("Date")) {
						if (oControl.getValue()) {
							aFilters.push(new Filter("Value", FilterOperator.BT, sap.ui.core.format.DateFormat.getDateInstance({
								pattern: "yyyy-MM-dd"
							}).format(oControl.getDateValue()), sap.ui.core.format.DateFormat.getDateInstance({
								pattern: "yyyy-MM-dd"
							}).format(oControl.getSecondDateValue())));
						}
					} else if (oControl.getId().includes("Select")) {
						if (oControl.getSelectedKey()) {
							aFilters.push(new Filter("Value", FilterOperator.EQ, oControl.getSelectedKey()));
						}
					} else {
						if (oControl.getValue()) {
							aFilters.push(new Filter("Value", FilterOperator.Contains, oControl.getValue()));
						}
					}
				});
			}
			this.getModel().read("/" + this._oInput.data("entitySet"), {
				filters: aFilters,
				success: function (oData, response) {

					var aResult = oData.results.map(function (oItem, index) {
						var oNewItem = {
							key: oItem[this._oInput.data("key")],
							descriptionKey: oItem[this._oInput.data("descriptionKey")]
						};
						$.each(oItem, function (key, value) {
							if (value instanceof Date) {
								oNewItem[key] = sap.ui.core.format.DateFormat.getDateInstance({
									pattern: "dd.MM.yyyy"
								}).format(value);
							} else {
								oNewItem[key] = value;
							}
						});
						return oNewItem;
					}.bind(this));
					this.getModel("help").getData().list = aResult;
					if (this._oInput.data("onDataReceived")) {
						this[this._oInput.data("onDataReceived")](aSelectionSet);
					}
					this.getModel("help").refresh(true);
					this._oValueHelpDialog.update();
					sap.ui.core.BusyIndicator.hide();
				}.bind(this),
				error: function (oError) {
					sap.ui.core.BusyIndicator.hide();
				}
			});
		},

		onClearButtonPress: function (oEvent) {
			this.bClearButtonPressed = true;
		},

		onLicenseVHFilter: function (oEvent, that) {
			var oBindingParams = oEvent.getParameter("bindingParams");

			var matnr = that.mStoData.getProperty(that.currentEditingPath + "/matnr")
			var matnrFilter1 = new sap.ui.model.Filter("matnr", "EQ", matnr);
			oBindingParams.filters.push(matnrFilter1);

			var CompCode = that.mStoData.getProperty("/bukrs");
			var CompCodeFilter2 = new sap.ui.model.Filter("bukrs", "EQ", CompCode);
			oBindingParams.filters.push(CompCodeFilter2);

			var customer = this.mStoData.getProperty(this.currentEditingPath + "/werks")
			var customerFilter3 = new sap.ui.model.Filter("kunnr", "EQ", customer);
			oBindingParams.filters.push(customerFilter3);

			var Plant = that.mStoData.getProperty("/reswk")
			var PlantFilter4 = new sap.ui.model.Filter("werks", "EQ", Plant);
			oBindingParams.filters.push(PlantFilter4);

		},
		_onSetSearchHelpDetails: function (ValueHelpField) {
			switch (ValueHelpField) {
				case "LoadingPoint":
					var sTitle = this.getResourceBundle().getText("LoadingPointSH");
					var sKey = this.getResourceBundle().getText("LoadingPoint");
					var sDescriptionName = this.getResourceBundle().getText("LoadingPointName");
					break;
				case "ContractNumber":
					sTitle = this.getResourceBundle().getText("ContractNumberSH");
					sKey = this.getResourceBundle().getText("ContractNumber");
					sDescriptionName = this.getResourceBundle().getText("ContractNumberName");
				default:
			}

			this.oHelpModel = new JSONModel({
				title: sTitle,
				key: this._oInput.data("key"),
				descriptionKey: this._oInput.data("descriptionKey"),
				Key: sKey,
				Name: sDescriptionName,
				list: [],
				searchResults: []
			});
			this.oHelpModel.setSizeLimit(100000);
			this.setModel(this.oHelpModel, "help");
		},



	});

});