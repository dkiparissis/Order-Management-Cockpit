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

	return Controller.extend("helpe.fastentryso.controller.BaseController", {
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

				this._oValueHelpDialog = sap.ui.xmlfragment("helpe.fastentryso.fragment.ValueHelpDialog", this);
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

				// { - evkontos 8.4.2024
				// }
				// return this._oValueHelpDialog;
				// } - evkontos 8.4.2024
				// { + evkontos 8.4.2024
				return this._oValueHelpDialog;
			} else {
				this._oValueHelpDialog.close();
				this._oValueHelpDialog.destroy();
			}
			// } + evkontos 8.4.2024
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

		onLicenseVHFilter: function (oEvent,that) {
			var oBindingParams = oEvent.getParameter("bindingParams");

			//I338362 replaced this.contract_Matnr with variable to avoid causing a problem with global variable
			var sContractMatnr = that.getModel("SalesOrder").getData().to_OrdersChangeItems.results[that.selectedrow].matnr;
			var MatnrFilter1 = new sap.ui.model.Filter("matnr", "EQ", sContractMatnr);
			oBindingParams.filters.push(MatnrFilter1);

			var bukrsFilter2 = new sap.ui.model.Filter("bukrs_vf", "EQ", that.contract_bukrs);
			oBindingParams.filters.push(bukrsFilter2);

			var soldTo = that.getView().getModel("SalesOrder").getProperty("/kunnr");
			var soldToFilter3 = new sap.ui.model.Filter("SoldToParty", "EQ", soldTo);
			oBindingParams.filters.push(soldToFilter3);

			var plant = that.getView().getModel("SalesOrder").getProperty("/werks");
			var plantFilter4 = new sap.ui.model.Filter("werks", "EQ", plant);
			oBindingParams.filters.push(plantFilter4);
			
		},

		processMessages: function (oData, that) {
			sap.ui.core.BusyIndicator.hide();
			that.byId("messagePopoverBtn").setVisible(true);
			sap.ui.core.BusyIndicator.hide();
			var msgs = [];
			var n = oData.length;
			var iSuccessIndex;
			var sErrorMsg = "";
			for (var i = 0; i < n; i++) {
				if (oData[i].Type == 'S') {
					oData[i].Type = "Success"
				}
				else if (oData[i].Type == 'W') {
					oData[i].Type = "Warning"
				}
				else if (oData[i].Type == 'E') {
					oData[i].Type = "Error"
					sErrorMsg += oData[i].Message + "\n";
				}
				var Messages = {
					type: oData[i].Type,
					title: oData[i].Message,
					description: oData[i].Message,
					counter: i + 1
				};

				//i338362 ensure success message is shown
				if (oData[i].Id === "V1" && oData[i].Number === "311") {
					iSuccessIndex = i;
				}
				msgs.push(Messages);
			}
			var oModelmsg = new JSONModel();
			oModelmsg.setData(msgs);
			// aReturns.push(oModelmsg);
			// aReturns.push(iSuccessIndex)
			that.getView().setModel(oModelmsg, "oModelmsg");
			that.byId("messagePopoverBtn").addDependent(that.oMessagePopover);
			if (sErrorMsg !== "") {
				MessageBox.error(sErrorMsg);
			}
			else if (iSuccessIndex) {
				MessageBox.success(oData[iSuccessIndex].Message, {
					actions: [MessageBox.Action.OK],
					emphasizedAction: MessageBox.Action.OK,
					onClose: function () {
						that.getRouter().navTo("worklist", {}, true);
						location.reload();
						// that.getView().getModel("SalesOrder").setData();

					}
				});
			}

		},
		//I338362 single Validator for all 3 scanrios, item validation is same for Vessel and fuel so have another method for both
		_validateInputs: function (type) {
			var oSalesModel = this.getView().getModel("SalesOrder"),
				oData = oSalesModel.getData(),
				aItems = oData?.to_OrdersChangeItems?.results,
				bValid = true;
			var results = {};
			var missingProperties = "";
			switch (type) {
				case "Fuel":
					var bHasContract = this.getView().getModel("contractModel").getProperty("/hasContract")
					if (!(oData.SalesContract) && bHasContract) {
						missingProperties += "Sales Contract\n";
						bValid = false;
					}
					if (!(oData.kunnr) && !bHasContract) {
						missingProperties += "Customer Number\n";
						bValid = false;
					}
					if (!(oData.ShipToParty)) {
						missingProperties += "Ship To Party\n";
						bValid = false;
					}
					if (!(oData.zzdestid)) {
						missingProperties += "Destination ID\n";
						bValid = false;
					}
					if (!(oData.vstel)) {
						missingProperties += "Sales Office\n";
						bValid = false;
					}
					if (!(oData.zzhandid)) {
						missingProperties += "Hand ID\n";
						bValid = false;
					}
					if (!(oData.ShippingType)) {
						missingProperties += "Shipping Type\n";
						bValid = false;
					}
					if (!(oData.zzvehicle)) {
						missingProperties += "Vehicle\n";
						bValid = false;
					}
					if (!(oData.zzcardidso)) {
						missingProperties += "Card ID\n";
						bValid = false;
					}
					if (!(oData.vdatu)) {
						missingProperties += "Delivery Date\n";
						bValid = false;
					}

					results = this.checkItemProperties(aItems, missingProperties);
					if (results.missingProperties.length > 0 || !bValid) {
						results.bValid = false;
					}
					break;
				case "Vessel":
					var bHasContract = this.getView().getModel("contractModel").getProperty("/hasContract")
					if (!(oData.SalesContract) && bHasContract) {
						missingProperties += "Sales Contract\n";
						bValid = false;
					}
					if (!(oData.kunnr) && !bHasContract) {
						missingProperties += "Customer Number\n";
						bValid = false;
					}
					if (!(oData.ShipToParty)) {
						missingProperties += "Ship To Party\n";
						bValid = false;
					}
					if (!(oData.zzdestid)) {
						missingProperties += "Destination ID\n";
						bValid = false;
					}
					if (!(oData.vstel)) {
						missingProperties += "Sales Office\n";
						bValid = false;
					}
					if (!(oData.zzhandid)) {
						missingProperties += "Hand ID\n";
						bValid = false;
					}
					if (!(oData.ShippingType)) {
						missingProperties += "Shipping Type\n";
						bValid = false;
					}
					if (!(oData.vdatu)) {
						missingProperties += "Delivery Date\n";
						bValid = false;
					}

					results = this.checkItemProperties(aItems, missingProperties);
					if (results.missingProperties.length > 0 || !bValid) {
						results.bValid = false;
					}
					break;
				case "inTank":
					if (!(oData.SalesContract) && bHasContract) {
						missingProperties += "Sales Contract\n";
						bValid = false;
					}
					if (!(oData.ShipToParty)) {
						missingProperties += "Ship To Party\n";
						bValid = false;
					}
					if (!(oData.zzdestid)) {
						missingProperties += "Destination ID\n";
						bValid = false;
					}
					if (!(oData.vstel)) {
						missingProperties += "Sales Office\n";
						bValid = false;
					}
					if (!(oData.zzhandid)) {
						missingProperties += "Hand ID\n";
						bValid = false;
					}
					if (!(oData.ShippingType)) {
						missingProperties += "Shipping Type\n";
						bValid = false;
					}
					if (!(oData.vdatu)) {
						missingProperties += "Delivery Date\n";
						bValid = false;
					}

					aItems.forEach(function (oItem) {
						if (!!oItem.indicator && oItem.indicator !== "D") {
							if (!(oItem.matnr)) {
								missingProperties += "Material Number\n";
								bValid = false;
							}
							if (!(oItem.TargetQuantity)) {
								missingProperties += "Target Quantity\n";
								bValid = false;
							}
							if (!(oItem.TargetQuantityUnit)) {
								missingProperties += "Target Quantity Unit\n";
								bValid = false;
							}
							if (!(oItem.oihantyp)) {
								missingProperties += "Order Item Type\n";
								bValid = false;
							}
							if (!(oItem.inco1)) {
								missingProperties += "Incoterms\n";
								bValid = false;
							}
						}
					});
					results.bValid = bValid;
					results.missingProperties = missingProperties;
					break;
				default:
					break;
			}
			if (!results.bValid) {
				MessageBox.error("Please fill in below  fields:\n \n" + results.missingProperties);
			}
			return results.bValid;
		},

		checkItemProperties: function (aItems, missingProperties) {
			var bValid = true;

			aItems.forEach(function (oItem) {
				if (!!oItem.indicator && oItem.indicator !== "D") {
					if (!(oItem.matnr)) {
						missingProperties += "Material Number\n";
						bValid = false;
					}
					if (!(oItem.TargetQuantity)) {
						missingProperties += "Target Quantity\n";
						bValid = false;
					}
					if (!(oItem.TargetQuantityUnit)) {
						missingProperties += "Target Quantity Unit\n";
						bValid = false;
					}
					if (!(oItem.oihantyp)) {
						missingProperties += "Handling Type\n";
						bValid = false;
					}
					if (!(oItem.inco1)) {
						missingProperties += "Incoterms\n";
						bValid = false;
					}
				}
			});

			return {
				missingProperties: missingProperties,
				bValid: bValid
			};
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
		}
	});

});