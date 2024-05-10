sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (BaseController, JSONModel, formatter, Filter, FilterOperator) {
    "use strict";

    return BaseController.extend("helpe.fastentryso.controller.Worklist", {

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
            var S1 = this.getOwnerComponent().getModel("S1");
            // this.getView().setModel(S1);
        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        onPressCreateRequest: function (oEvent) {
            this.editableFunction(true,true);
            //Emptying the Sales Order Data model
            this.getOwnerComponent().getModel("SOModel").destroy();
            // { - evkontos 15.4.2024
            // this.getRouter().navTo("object", {
            //     objectId: "213"
            // });
            // } - evkontos 15.4.2024
            // { + evkontos 15.4.2024
            var sMode = oEvent.getSource().data().mode; // + evkontos 20.4.2024
            this.getRouter().navTo("object", {
                objectId: "new",
                mode: sMode
            });
            // } + evkontos 15.4.2024
        },

        /* ab : function() {
            alert("hi");
        }, */

        onPressCreateRequest_V: function (oEvent) {
            this.editableFunction(true,true);
            //Emptying the Sales Order Data model
            this.getOwnerComponent().getModel("SOModel").destroy();
            // this.getRouter().navTo("object_V"); // - evkontos 15.4.2024
            // { + evkontos 15.4.2024
            var sMode = oEvent.getSource().data().mode; // + evkontos 20.4.2024
            this.getRouter().navTo("object_V", {
                objectId: "new",
                mode: sMode
            });
            // } + evkontos 15.4.2024
        },

        onPressCreateRequest_InTank: function () {
            this.editableFunction(true,true);
            //Emptying the Sales Order Data model
            this.getOwnerComponent().getModel("SOModel").destroy();
            // this.getRouter().navTo("object_T"); // - evkontos 15.4.2024
            // { + evkontos 15.4.2024
            this.getRouter().navTo("object_T", {
                objectId: "new",
                mode: "create"
            });
            // } + evkontos 15.4.2024
        },

        onClickSOLink:function(oEvent) {
            var selectedVal = oEvent.getSource().getProperty('text');
            var model = this.getOwnerComponent().getModel();
            var that = this;
            model.read("/ZSD_CDS_B_ORDERS(SalesOrder='" + selectedVal + "')", {
                urlParameters: {
                    "$expand": "to_OrdersChangeItems"
                },
                success: function (oData, oResponse) {
                    if (oData !== undefined) {

                        // Setting Sales Order Data
                        var SOModel = that.getOwnerComponent().getModel("SOModel");
                        SOModel.setData(oData);

                        //Setting Editable Properties of Fields 
                        that.editableFunction(false,false);

                        var MOT = oData.ShippingType;
                        if (MOT == '01' || MOT == '02' || MOT == '05' || MOT == '06' || MOT == '07' ) {
                            // { - evkontos 15.4.2024
                            // that.getRouter().navTo("object", {
                            //     objectId: "213"
                            // });
                            // } - evkontos 15.4.2024
                            // { + evkontos 15.4.2024
                            that.getRouter().navTo("object", {
                                objectId: selectedVal,
                                mode: "display"
                            });
                            // } + evkontos 15.4.2024

                        }
                        else if (MOT == '03' || MOT == '04' || MOT == '08' || MOT == '09' || MOT == '10' ) {
                            // that.getRouter().navTo("object_V");    // - evkontos 15.4.2024
                            // { + evkontos 15.4.2024
                            that.getRouter().navTo("object_V", {
                                objectId: selectedVal,
                                mode: "display"
                            });
                            // } + evkontos 15.4.2024
                        }
                        else if (MOT == '11' ) {
                            // that.getRouter().navTo("object_InTanks");    // - evkontos 13.4.2024
                            // { + evkontos 15.4.2024
                            that.getRouter().navTo("object_T", {
                                objectId: selectedVal,
                                mode: "display"
                            });
                            // } + evkontos 15.4.2024
                        }
                    }
                },

                error: function (oError) {
                    alert("Read ERROR");
                }
            });
        },

        onEdit: function (oEvent) {
            var selectedVal = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[0].mProperties.text;
            var model = this.getOwnerComponent().getModel();
            var that = this;
            model.read("/ZSD_CDS_B_ORDERS(SalesOrder='" + selectedVal + "')", {
                urlParameters: {
                    "$expand": "to_OrdersChangeItems"
                },
                success: function (oData, oResponse) {
                    if (oData !== undefined) {

                        // Setting Sales Order Data
                        var SOModel = that.getOwnerComponent().getModel("SOModel");
                        SOModel.setData(oData);

                        //Setting Editable Properties of Fields 
                        that.editableFunction(false,true);

                        var MOT = oData.ShippingType;
                        if (MOT == '01' || MOT == '02' || MOT == '05' || MOT == '06' || MOT == '07' ) {
                            // { - evkontos 15.4.2024
                            // that.getRouter().navTo("object", {
                            //     objectId: "213"
                            // });
                            // } - evkontos 15.4.2024
                            // { + evkontos 15.4.2024
                            that.getRouter().navTo("object", {
                                objectId: selectedVal,
                                mode: "edit"
                            });
                            // } + evkontos 15.4.2024
                        }
                        else if (MOT == '03' || MOT == '04' || MOT == '08' || MOT == '09' || MOT == '10' ) {
                            // that.getRouter().navTo("object_V");  // - evkontos 15.4.2024
                            // { + evkontos 15.4.2024
                            that.getRouter().navTo("object_V", {
                                objectId: selectedVal,
                                mode: "edit"
                            });
                            // } + evkontos 15.4.2024
                        }
                        // { + evkontos 15.4.2024
                        else if (MOT == '11' ) {
                            that.getRouter().navTo("object_T", {
                                objectId: selectedVal,
                                mode: "edit"
                            });
                        }
                        // } + evkontos 15.4.2024
                    }
                },

                error: function (oError) {
                    alert("Read ERROR");
                }
            });

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
        },

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
        onNavBack: function () {
            // eslint-disable-next-line fiori-custom/sap-no-history-manipulation, fiori-custom/sap-browser-api-warning
            history.go(-1);
        },

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

        },

        /**
         * Event handler for refresh event. Keeps filter, sort
         * and group settings and refreshes the list binding.
         * @public
         */
        onRefresh: function () {
            var oTable = this.byId("table");
            oTable.getBinding("items").refresh();
        },

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        /**
         * Shows the selected item on the object page
         * @param {sap.m.ObjectListItem} oItem selected Item
         * @private
         */
        /* _showObject: function (oItem) {
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

        editableFunction: function (TorF,onlyDisplay) {
            var editableModel = this.getOwnerComponent().getModel("editableModel");
            var editVals =
            {
                //Header Fields
                "onlyDisplay" : onlyDisplay,
                "SalesOrg": TorF,
                "DistrChan": TorF,
                "Division": TorF,
                "DocType": TorF,
                "RefDoc": TorF,
                "Zzmrnssdn": TorF,
                "Plant": TorF,
                "IntercompKunnr": TorF,
                "ShipToKunnr": TorF,
                "Vsart": TorF,
                "Zzhandid": TorF,

                //Item Fields
                "ContractNo": TorF,
                "ContractItem": TorF,
                "MaterialLong": TorF,
                "Zzcomp": TorF,
                "Zzcompcap": TorF,
                "Zzcompcapuom": TorF,
                "Zzdestid": TorF,
                "Zzloadid": TorF,
                "OicMot": TorF,
                "Oihantyp": TorF,
                "Zzitbrand": TorF,
                "AddBtn" : TorF,

            };
            editableModel.setData(editVals);

        },

        beforeGo: function (oEvent) {
            var entitySet, oBindingParams, startFilter;
            oBindingParams = oEvent.getParameter("bindingParams");
            var startFilter = new sap.ui.model.Filter("SalesOrganization", "EQ", '1000');
            oBindingParams.filters.push(startFilter);
            
            var startFilter1 = new sap.ui.model.Filter("OrganizationDivision", "NE", '20');
            oBindingParams.filters.push(startFilter1);

            var startFilter2 = new sap.ui.model.Filter("SalesOrganization", "EQ", '7800');
            oBindingParams.filters.push(startFilter2);
            //I338362 filter out empty shipping type
            var startFilter3 = new sap.ui.model.Filter("ShippingType", "NE", '');
            oBindingParams.filters.push(startFilter3);
        }
    });
});
