sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (BaseController, JSONModel, formatter, Filter, FilterOperator) {
    "use strict";

    return BaseController.extend("sto.controller.Worklist", {

        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when the worklist controller is instantiated.
         * @public
         */
        onInit: function () {
            var oViewModel;

            // keeps the search state
            this._aTableSearchState = [];

            // Model used to manipulate control states
            oViewModel = new JSONModel({
                worklistTableTitle: this.getResourceBundle().getText("worklistTableTitle"),
                shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
                shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
                tableNoDataText: this.getResourceBundle().getText("tableNoDataText")
            });
            this.setModel(oViewModel, "worklistView");
            // var S1 = this.getOwnerComponent().getModel("S1");
            // this.getView().setModel(S1);
        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        onPressCreateRequest: function (oEvent) {
            // { - evkontos 28.4.2024
            // this.editableFunction(true,true);
            //Emptying the Sales Order Data model
            // this.getOwnerComponent().getModel("SOModel").destroy();
            // var sMode = oEvent.getSource().data().mode;
            // this.getRouter().navTo("object", {
            //     //  objectId: "213"
            //     objectId: "new",
            //     mode: "create"
            // });
            // } - evkontos 28.4.2024
            this._navTo({ ebeln: "new", motid: oEvent.getSource().data().motid }, "create");  // + evkontos 28.4.2024
        },

        /* - evkontos 28.4.2024: not used
        onPressCreateRequest_V: function (oEvent) {
            this.editableFunction(true);
            //Emptying the Sales Order Data model
            this.getOwnerComponent().getModel("SOModel").destroy();
            var sMode = oEvent.getSource().data().mode; // Indranil
            this.getRouter().navTo("object_V" , {
                objectId: "new",
                mode: "create"
            });
        }, */

        /* - evkontos 28.4.2024: total refactory, model loading will be done in Object controller
        onClickSOLink: function (oEvent) {
            var selectedVal = oEvent.getSource().getProperty('text');
            var stoDocument = "10";
            //var stoDocument = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[1].mProperties.text ;
            var model = this.getOwnerComponent().getModel();
            var that = this;

            model.read("/ZMM_CDS_I_FAST_ENTRY(ebeln='" + selectedVal + "',ebelp='" + stoDocument + "')", {
                urlParameters: {
                    // "$expand": "to_OrdersChangeItems"
                    "$expand": "to_OrdersChangeItems,to_OrdersChangeItems/to_ScheduleLine"
                },
                success: function (oData, oResponse) {
                    if (oData !== undefined) {

                        // Setting Sales Order Data
                        var SOModel = that.getOwnerComponent().getModel("SOModel");
                        SOModel.setData(oData);

                        //Setting Editable Properties of Fields 
                        that.editableFunction(false, false);

                        var MOT = oData.motid;
                        if (MOT == '01' || MOT == '02' || MOT == '05' || MOT == '06' || MOT == '07') {
                            that.getRouter().navTo("object", {
                                objectId: selectedVal,
                                mode: "display"
                            });
                        } else if (MOT == '03' || MOT == '04' || MOT == '08' || MOT == '09' || MOT == '10') {
                            that.getRouter().navTo("object_V", {
                                objectId: selectedVal,
                                mode: "display"
                            });
                        }
                    }
                },
                error: function (oError) {
                    alert("Read ERROR");
                }
            });
        }, */

        /* - evkontos 28.4.2024: total refactory, model loading will be done in Object controller
        onEdit: function (oEvent) {

            var selectedVal = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[0].mProperties.text;
            var stoDocument = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[1].mProperties.text ;
            var model = this.getOwnerComponent().getModel();
            var that = this;

            model.read("/ZMM_CDS_I_FAST_ENTRY(ebeln='" + selectedVal + "',ebelp='" + stoDocument + "')", {
                urlParameters: {
                    "$expand": "to_OrdersChangeItems"
                    // "$expand": "to_OrdersChangeItems,to_OrdersChangeItems/to_ScheduleLine"
                },
                success: function (oData, oResponse) {
                    if (oData !== undefined) {

                        // Setting Sales Order Data
                        var SOModel = that.getOwnerComponent().getModel("SOModel");
                        SOModel.setData(oData);

                        //Setting Editable Properties of Fields 
                        that.editableFunction(false,true);

                        var MOT = oData.motid;
                        if (MOT == '01' || MOT == '02' || MOT == '05' || MOT == '06' || MOT == '07' ) {
                            that.getRouter().navTo("object", {
                                // objectId: "selectedVal", // - evkontos 24.4.2024
                                objectId: selectedVal,    // + evkontos 24.4.2024
                                mode: "edit"
                            });
                        }
                        else if (MOT == '03' || MOT == '04' || MOT == '08' || MOT == '09' || MOT == '10' ) {
                            that.getRouter().navTo("object_V",{

                                objectId: selectedVal,
                                mode: "edit"
                            });
                        }
                    }
                },

                error: function (oError) {
                    alert("Read ERROR");
                }
            });
        }, */

        // + evkontos 28.4.2024
        onClickSOLink: function (oEvent) {
            this._navTo(oEvent.getSource().getBindingContext().getObject(), "display");
        },

        // + evkontos 28.4.2024
        onEdit: function (oEvent) {
            this._navTo(this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getBindingContext().getObject(), "edit");
        },

        // + evkontos 28.4.2024
        _navTo: function (oObj, sMode) {
            var sEbeln = oObj.ebeln,
                sMotId = oObj.motid,
                sTarget = "";

            switch (sMotId) {
                case "01": case "02": case "05": case "06":
                    sTarget = "object";
                    break;
                case "03": case "04": case "08": case "09": case "10": case "07":
                    sTarget = "object_V";
                    break;
                default:
                    break;
            }

            //TODO: this will probably be gone
            // if (sMode === "display") {
            //     this.editableFunction(false, false);
            // } else {    // edit
            //     this.editableFunction(false, true);
            // }

            this.getRouter().navTo(sTarget, { objectId: sEbeln, mode: sMode });
        },

        /**
         * Triggered by the table's 'updateFinished' event: after new table
         * data is available, this handler method updates the table counter.
         * This should only happen if the update was successful, which is
         * why this handler is attached to 'updateFinished' and not to the
         * table's list binding's 'dataReceived' method.
         * @param {sap.ui.base.Event} oEvent the update finished event
         * @public
         */
        /* - evkontos 28.4.2024: not used
        onUpdateFinished: function (oEvent) {
            // update the worklist's object counter after the table update
            var sTitle,
                oTable = oEvent.getSource(),
                iTotalItems = oEvent.getParameter("total");
            // only update the counter if the length is final and
            // the table is not empty
            if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
                sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
            } else {
                sTitle = this.getResourceBundle().getText("worklistTableTitle");
            }
            this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
        }, */

        /**
         * Event handler when a table item gets pressed
         * @param {sap.ui.base.Event} oEvent the table selectionChange event
         * @public
         */
        /* onPress: function (oEvent) {
            // The source is the list item that got pressed
            this._showObject(oEvent.getSource());
        }, */

        /**
         * Event handler for navigating back.
         * Navigate back in the browser history
         * @public
         */
        /* - evkontos 28.4.2024: not used
        onNavBack: function () {
            // eslint-disable-next-line fiori-custom/sap-no-history-manipulation, fiori-custom/sap-browser-api-warning
            history.go(-1);
        }, */

        /* - evkontos 28.4.2024: not used
        onSearch: function (oEvent) {
            if (oEvent.getParameters().refreshButtonPressed) {
                // Search field's 'refresh' button has been pressed.
                // This is visible if you select any main list item.
                // In this case no new search is triggered, we only
                // refresh the list binding.
                this.onRefresh();
            } else {
                var aTableSearchState = [];
                var sQuery = oEvent.getParameter("query");

                if (sQuery && sQuery.length > 0) {
                    aTableSearchState = [new Filter("CreatedBy", FilterOperator.Contains, sQuery)];
                }
                this._applySearch(aTableSearchState);
            }
        }, */

        /**
         * Event handler for refresh event. Keeps filter, sort
         * and group settings and refreshes the list binding.
         * @public
         */
        /* - evkontos 28.4.2024: not used
        onRefresh: function () {
            var oTable = this.byId("table");
            oTable.getBinding("items").refresh();
        }, */

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        /**
         * Shows the selected item on the object page
         * @param {sap.m.ObjectListItem} oItem selected Item
         * @private
         */
        /* - evkontos 28.4.2024: not used
        _showObject: function (oItem) {
            this.getRouter().navTo("object", {
                objectId: oItem.getBindingContext().getPath().substring("/SalesOrderListSet".length)
            });
        }, */

        /**
         * Internal helper method to apply both filter and search state together on the list binding
         * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
         * @private
         */
        _applySearch: function (aTableSearchState) {
            var oTable = this.byId("table"),
                oViewModel = this.getModel("worklistView");
            oTable.getBinding("items").filter(aTableSearchState, "Application");
            // changes the noDataText of the list in case there are no filter results
            if (aTableSearchState.length !== 0) {
                oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
            }
        },

        /* - evkontos 28.4.2024: not used
        editableFunction: function (TorF,onlyDisplay) {
            var editableModel = this.getOwnerComponent().getModel("editableModel");
            var editVals =
            {
                //Header Fields

                "onlyDisplay": onlyDisplay,
                "destid" : TorF,
                "werks" : TorF,
                "motid": TorF,
                
                "zzvendor": TorF,
                "SalesOrg": TorF,
                "ContractNo": TorF,
                

                //Item Fields

                "STONo": TorF,
                "MaterialNo": TorF,
                "MaterialLong": TorF,
                "Zzcomp": TorF,
                "Zzcompcap": TorF,
                "Zzcompcapuom": TorF,
                "Zzdestid": TorF,
                "Zzloadid": TorF,
                "OicMot": TorF,
                "Oihantyp": TorF,
                "Zzitbrand": TorF,
                "AddBtn" : TorF
            };
            editableModel.setData(editVals);
        }, */

        /* - evkontos 28.4.2024: not used
        beforeGo: function (oEvent) {
            // var entitySet, oBindingParams, startFilter;
            // oBindingParams = oEvent.getParameter("bindingParams");
            // var startFilter = new sap.ui.model.Filter("SalesOrganization", "EQ", '1000');
            // oBindingParams.filters.push(startFilter);
            // var startFilter1 = new sap.ui.model.Filter("OrganizationDivision", "NE", '20');
            // oBindingParams.filters.push(startFilter1);
        } */


    });
});
