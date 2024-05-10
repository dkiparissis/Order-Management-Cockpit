sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "../model/formatter",
    'sap/m/MessageBox',
    'sap/m/MessagePopover',
    'sap/m/MessageItem',
    'sap/m/Link',
    "sap/ui/core/Fragment",
    "sap/ui/model/FilterOperator"
], function (BaseController, JSONModel, History, formatter, MessageBox, MessagePopover, MessageItem, Link, Fragment, FilterOperator) {
    "use strict";

    return BaseController.extend("sto.controller.Object", {

        formatter: formatter,
        oMessagePopover: "",
        // contract_SalesOrganization: "",
        // contract_DistributionChannel: "",
        // contract_OrganizationDivision: "",
        contract_Matnr: "",
        // contract_bukrs: "",
        // salesOrder: "",

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when the worklist controller is instantiated.
         * @public
         */
        onInit: function () {
            // Model used to manipulate control states. The chosen values make sure,
            // detail page shows busy indication immediately so there is no break in
            // between the busy indication for loading the view's meta data

            // var oViewModel = new JSONModel({
            //         busy : true,
            //         delay : 0
            //     });

            this.getView().setModel(new JSONModel({
                "Title": "Truck/Train",
                "Text": "Create Stock Transfer Order",
                "Icon": "sap-icon://shipping-status",
                "Item": "STO Item"
            }), "textModel");

            var oModelbrand = new JSONModel({
                items: [{
                    "Brand": "",
                    "Description": ""
                }, {
                    "Brand": "EKO",
                    "Description": "EKO"
                }, {
                    "Brand": "EK",
                    "Description": "EK"
                }]
            });
            this.getView().setModel(oModelbrand, "oModelbrand");
            // var oViewModel = new JSONModel({});
            this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
            // this.setModel(oViewModel, "SalesOrder"); // - evkontos 28.4.2024
            // { + evkontos 28.4.2024
            this.mViewModel = new JSONModel({ mode: "display" });  // initially display
            this.setModel(this.mViewModel, "viewModel");
            this.mStoData = new JSONModel({});
            this.setModel(this.mStoData, "stoData");
            // } + evkontos 28.4.2024

            var oMessageTemplate = new MessageItem({
                type: '{oModelmsg>type}',
                title: '{oModelmsg>title}',
                activeTitle: "{oModelmsg>active}",
                description: '{oModelmsg>description}',
                subtitle: '{oModelmsg>subtitle}',
                counter: '{oModelmsg>counter}'
            });
            this.oMessagePopover = new MessagePopover({
                items: {
                    path: 'oModelmsg>/',
                    template: oMessageTemplate
                },
                activeTitlePress: function () {
                    MessageToast.show('Active title is pressed');
                }
            });

            this.getView().setModel(new JSONModel([{
                uom: "",
                Descr: ""
            }, {
                uom: "KG",
                Descr: "Kilogram"
            }, {
                uom: "L",
                Descr: "Liter"
            }]), "uomData");

            var smartValueHelpModel = new JSONModel();
            // var objProp={
            //     "EntitySet" : ""
            // }
            // smartValueHelpModel.setData(objProp);
            this.getView().setModel(smartValueHelpModel, "smartValueHelpModel");
            this.getView().setModel(new JSONModel([]), "vehicleData");
            this.getView().setModel(new JSONModel([]), "compartmentData");

            // this.byId("messagePopoverBtn").addDependent(this.oMessagePopover);

        },
        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */


        /**
         * Event handler  for navigating back.
         * It there is a history entry we go one step back in the browser history
         * If not, it will replace the current entry of the browser history with the worklist route.
         * @public
         */
        onNavBack: function () {
            var sPreviousHash = History.getInstance().getPreviousHash();
            if (sPreviousHash !== undefined) {
                // eslint-disable-next-line fiori-custom/sap-no-history-manipulation
                history.go(-1);
            } else {
                this.getRouter().navTo("worklist", {}, true);
            }
        },

        /*
        onPressNewLine: function () {
            var sData = this.getView().getModel("SalesOrder").getData();
            sData.to_OrdersChangeItems.results.push({
                "ebelp" :"10",
                "MaterialNo": "",
                "MaterialDesc": "",
                "Uom": "",
                "DeliveryDate": "",
                "RecPlant": "",
                "RecPlantName": "",
                "RecSloc": "",
                "ValuationType": "",
                "LicID": "",
                "NoCompPlanning": "",
                "oihantyp": "",
                "oih_licin": "",
                "stodestiditem":"",
                "inco1": "",
                "oic_mot": this.getView().getModel("SalesOrder").getProperty("/mot"),
                "oic_motDesc": this.getView().getModel("SalesOrder").getProperty("/motDesc") 
            });
            this.getView().getModel("SalesOrder").refresh();
        },
        */

        addNewLines: function (aItems, sType) {
            var oModel = this.mStoData,
                oData = oModel.getData();

            aItems.forEach(function (oItem, iIndex) {
                oData.stoItems.push({
                    "ebelp": "10",
                    "matnr": "",
                    "eindt": undefined,
                    "menge": 0,
                    "meins": "",
                    "zz_comp_po": oItem.Compartmentno,
                    "zz_compcap_po": +oItem.Volume,
                    "zz_compcapuom_po": oItem.Uom,
                    "bwtar": "",
                    "werks": "",
                    "werksDesc": "",
                    "oih_licin": "",
                    "zzvehicle": oModel.getProperty("/zzvehicle"),
                    "zztrailer": sType !== "truck" ? oModel.getProperty("/zztrailer") : "",
                    "indicator": "I"
                });
            });
            oModel.refresh();
        },

        onPressDeleteLine: function (oEvent) {
            /*
            var sData = this.getView().getModel("SalesOrder").getData();
            var aIndexes = oEvent.getSource().getBindingContext("SalesOrder").getPath().split("/");
            var iIndex = aIndexes[aIndexes.length - 1]
            sData.to_OrdersChangeItems.results.splice(iIndex, 1);
            this.getView().getModel("SalesOrder").refresh(); */

            var oDeletedContext = oEvent.getSource().getBindingContext("stoData"),
                sDeletionPath = oDeletedContext.getPath();

            this.mStoData.setProperty(sDeletionPath + "/indicator", "D");
        },

        onPressCancel: function () {
            var sPreviousHash = History.getInstance().getPreviousHash();

            if (sPreviousHash !== undefined) {
                history.go(-1);
            } else {
                this.getRouter().navTo("worklist", {}, true);
            }
        },

        saveSTO: function () {
            var oModel = this.mStoData,
                oModelData = oModel.getData(),
                aItems = [],
                that = this;

            for (var i = 0; i < oModelData.stoItems.length; i++) {

                var oItem = oModelData.stoItems[i];

                if ((!(oItem?.indicator)) || (oItem?.indicator) !== "D") {
                    var oObj = {
                        "MaterialLong": oItem.matnr,
                        "ReceivePlant": oItem.werks,
                        "ReceiveLgort": "1000",
                        "Quantity": (+oItem.menge).toString(),
                        "PoUnit": oItem.meins,
                        "ValType": oItem.bwtar,
                        "DeliveryDate": this.formatter.deliveryDateFormatter(oItem.eindt),
                        "Updkz": "I",
                        "Ebelp": "00010",
                        "Zzdestid": oModelData.stodestid,
                        "OihantypGi": oItem.oihantyp,
                        "OihLicin": oItem.oih_licin,
                        "ZzCompPo": oItem.zz_comp_po,
                        "ZzCompcapPo": (+oItem.zz_compcap_po).toString(),
                        "ZzCompcapuomPo": oItem.zz_compcapuom_po,
                        "ZzVehiclePo": oItem.zzvehicle,
                        "ZzTrailerPo": oItem.zztrailer
                        // "Zzdrivercode": oModelData.zzdrivercode,
                        // "Zzdriverfname": oModelData.zzdriverfname,
                        // "Zzdriverlname": oModelData.zzdriverlname
                    };
                    aItems.push(oObj);
                }
            }

            var oPayload = {
                "CompCode": oModelData.bukrs,
                "PurchOrg": oModelData.ekorg,
                "PurGroup": oModelData.ekgrp,
                "SupplPlnt": oModelData.reswk,
                "Zzvehicle": oModelData.zzvehicle,
                "Zztrailer": oModelData.zztrailer,
                "Zzdriver": oModelData.zzdrivercode,
                "zz_driverfname": oModelData.zz_driverfname,
                "zz_driverlname": oModelData.zz_driverlname,
                "Zzvsart": oModelData.motid,
                "ZzHandid": oModelData.zzhandid,
                "Ebeln": "",
                "TargetCustomer": "",
                "TargetLoc": "",
                "Zzimo": "",
                "Bsart": oModelData.bsart,
                "IssueStrLoc": "1000",
                "Inco1": oModelData.Incoterm,
                "Zzcardid": oModelData.zz_cardid,
                "ZzSealPo": oModelData.zz_seal_po,
                "toSTOCreateItem": aItems,
                "toSTOCreateReturn": []
            };

            this.getView().getModel().create("/STOHeaderCreateSet", oPayload, {
                success: function (oData) {
                    that.byId("messagePopoverBtn").setVisible(true);
                    sap.ui.core.BusyIndicator.hide();

                    var msgs = [],
                        n = oData.toSTOCreateReturn.results.length;
                    for (var i = 0; i < n; i++) {
                        if (oData.toSTOCreateReturn.results[i].Type === "S") {
                            oData.toSTOCreateReturn.results[i].Type = "Success";
                        }
                        else if (oData.toSTOCreateReturn.results[i].Type === "W") {
                            oData.toSTOCreateReturn.results[i].Type = "Warning";
                        }
                        else if (oData.toSTOCreateReturn.results[i].Type === "E") {
                            oData.toSTOCreateReturn.results[i].Type = "Error";
                        }
                        var Messages = {
                            type: oData.toSTOCreateReturn.results[i].Type,
                            title: oData.toSTOCreateReturn.results[i].Message,
                            description: oData.toSTOCreateReturn.results[i].Message,
                            counter: i + 1
                        };
                        msgs.push(Messages);
                    }
                    var oModelmsg = new JSONModel();
                    oModelmsg.setData(msgs);
                    that.getView().setModel(oModelmsg, "oModelmsg");
                    that.byId("messagePopoverBtn").addDependent(that.oMessagePopover);

                    // var i, n;
                    n = oData.toSTOCreateReturn.results.length;
                    for (var j = 0; j < n; j++) {
                        if (oData.toSTOCreateReturn.results[j].Id === "06" && oData.toSTOCreateReturn.results[j].Number === "017") {
                            // MessageBox.success(oData.toSOMotTrucksCrReturn.results[i].Message);
                            // that.getView().getModel("SalesOrder").setData("");
                            MessageBox.success(oData.toSTOCreateReturn.results[j].Message, {
                                actions: [MessageBox.Action.OK],
                                emphasizedAction: MessageBox.Action.OK,
                                onClose: function () {
                                    that.getRouter().navTo("worklist", {}, true);
                                    // that.getView().getModel("SalesOrder").setData();
                                }
                            });
                        }
                    }

                },
                error: function (oError) {
                    sap.ui.core.BusyIndicator.hide();
                }
            });
        },

        editSTO: function () {
            var oModel = this.mStoData,
                oModelData = oModel.getData(),
                aItems = [],
                that = this;

            for (var i = 0; i < oModelData.stoItems.length; i++) {
                var oItem = oModelData.stoItems[i],
                    bInclude = true;

                if (oItem.indicator === "D") {
                    bInclude = false;
                }

                var oObj = {
                    "MaterialLong": oItem.matnr,
                    "ReceivePlant": oItem.werks,
                    "ReceiveLgort": "1000",
                    "Quantity": (+oItem.menge).toString(),
                    "PoUnit": oItem.meins,
                    "ValType": oItem.bwtar,
                    "DeliveryDate": this.formatter.deliveryDateFormatter(oItem.eindt),
                    "Updkz": (!!(oItem.indicator)) ? oItem.indicator : "U",
                    "Ebelp": oItem.ebelp,
                    "Zzdestid": oModelData.stodestid,
                    "OihantypGi": oItem.oihantyp,
                    "OihLicin": oItem.oih_licin,
                    "ZzCompPo": oItem.zz_comp_po,
                    "ZzCompcapPo": (+oItem.zz_compcap_po).toString(),
                    "ZzCompcapuomPo": oItem.zz_compcapuom_po,
                    "ZzVehiclePo": oItem.zzvehicle,
                    "ZzTrailerPo": oItem.zztrailer
                    // "Zzdrivercode": oModelData.zzdrivercode,
                    // "Zzdriverfname": oModelData.zzdriverfname,
                    // "Zzdriverlname": oModelData.zzdriverlname
                };

                if (bInclude) {
                    aItems.push(oObj);
                }
            }

            var oPayload = {
                "CompCode": oModelData.bukrs,
                "PurchOrg": oModelData.ekorg,
                "PurGroup": oModelData.ekgrp,
                "SupplPlnt": oModelData.reswk,
                "Zzvehicle": oModelData.zzvehicle,
                "Zztrailer": oModelData.zztrailer,
                "Zzdriver": oModelData.zzdrivercode,
                "zz_driverfname": oModelData.zz_driverfname,
                "zz_driverlname": oModelData.zz_driverlname,
                "Zzvsart": oModelData.motid,
                "ZzHandid": oModelData.zzhandid,
                "Ebeln": oModelData.ebeln,
                "TargetCustomer": "",
                "TargetLoc": "",
                "Zzimo": "",
                "Bsart": oModelData.bsart,
                "IssueStrLoc": "1000",
                "Inco1": oModelData.Incoterm,
                "Zzcardid": oModelData.zz_cardid,
                "ZzSealPo": oModelData.zz_seal_po,
                "toSTOChangeItem": aItems,
                "toSTOChangeReturn": []
            };

            this.getView().getModel().create("/STOHeaderChangeSet", oPayload, {
                // method: "PUT",
                success: function (oData) {
                    that.byId("messagePopoverBtn").setVisible(true);
                    sap.ui.core.BusyIndicator.hide();

                    var msgs = [],
                        n = oData.toSTOChangeReturn.results.length;
                    for (i = 0; i < n; i++) {
                        if (oData.toSTOChangeReturn.results[i].Type === "S") {
                            oData.toSTOChangeReturn.results[i].Type = "Success";
                        }
                        else if (oData.toSTOChangeReturn.results[i].Type === "W") {
                            oData.toSTOChangeReturn.results[i].Type = "Warning";
                        }
                        else if (oData.toSTOChangeReturn.results[i].Type === "E") {
                            oData.toSTOChangeReturn.results[i].Type = "Error";
                        }
                        var Messages = {
                            type: oData.toSTOChangeReturn.results[i].Type,
                            title: oData.toSTOChangeReturn.results[i].Message,
                            description: oData.toSTOChangeReturn.results[i].Message,
                            counter: i + 1
                        };
                        msgs.push(Messages);
                    }

                    var oModelmsg = new JSONModel();
                    oModelmsg.setData(msgs);
                    that.getView().setModel(oModelmsg, "oModelmsg");
                    that.byId("messagePopoverBtn").addDependent(that.oMessagePopover);

                    n = oData.toSTOChangeReturn.results.length;
                    for (var j = 0; j < n; j++) {
                        if (oData.toSTOChangeReturn.results[j].Id === "06" && oData.toSTOChangeReturn.results[j].Number === "023") {
                            // MessageBox.success(oData.toSOMotTrucksCrReturn.results[i].Message);
                            // that.getView().getModel("SalesOrder").setData("");
                            MessageBox.success(oData.toSTOChangeReturn.results[j].Message, {
                                actions: [MessageBox.Action.OK],
                                emphasizedAction: MessageBox.Action.OK,
                                onClose: function () {
                                    that.getRouter().navTo("worklist", {}, true);
                                    // that.getView().getModel("SalesOrder").setData();
                                }
                            });
                        }

                        if (oData.toSTOChangeReturn.results[j].Id === "06" && oData.toSTOChangeReturn.results[j].Number === "022") {
                            MessageBox.information(oData.toSTOChangeReturn.results[j].Message);
                        }
                    }
                },
                error: function (oError) {
                    sap.ui.core.BusyIndicator.hide();
                }
            });
        },

        onPressSave: function () {
            if (this._validateInputs()) {    // + evkontos 25.4.2024
                if (this.mViewModel.getProperty("/mode") === "edit") {
                    this.editSTO();
                } else {
                    this.saveSTO();
                }
            } else {
                MessageBox.error("Please fill in all mandatory fields.");
            }
        },

        /* - evkontos 28.4.2024: not used
        _getDate: function (date) {
            if (date !== null) {
                var dDate = new Date(date.getTime());
                var offset = dDate.getTimezoneOffset() / 60;
                var hours = dDate.getHours();
                dDate.setHours(hours - offset);
            }

            return dDate;
        }, */

        /* onValueHelpRequest: function (oEvent) {

            this._oInput = oEvent.getSource();
            this._onValueHelpRequest(this._oInput).open();
            this._onSearchValueHelp(null);
        }, */

        onOkValueHelp: function (oEvent) {
            if (this._oInput.data("onAfterSelect")) {
                this[this._oInput.data("onAfterSelect")](oEvent);
            } else {
                var aTokens = oEvent.getParameter("tokens");
                this._oInput.setValue(aTokens[0].getKey());
            }
            var vInput = this._oInput.getId().split("input")[1].split("-")[0];
            if (vInput === "SalesContract" || vInput === "ContractItem" || vInput === "DestinationID") {

                this._setDefaultValues(vInput, aTokens[0].getKey());
            }

            this._onValueHelpRequest("Close").close();
        },

        onSearchValueHelp: function (oEvent) {
            this._onSearchValueHelp(oEvent);
        },

        onCancelValueHelp: function () {
            //    this._onValueHelpRequest("Close").close();
            this.byId("selectDialog").close();
        },

        deleteOldLines: function (sVehicleno, sType) {
            var sPath = "/stoItems",
                aItems = this.mStoData.getProperty(sPath);

            aItems?.forEach(function (oItem) {
                if (sType === "truck") {
                    /* - evkontos 10.5.2024
                    if ((oItem.zzvehicle !== sVehicleno) && (oItem.zztrailer === "")) {
                        // if ((oItem.zzvehicle !== "") && (oItem.zztrailer === "")) {
                        oItem.indicator = "D";
                    } */
                    // { + evkontos 10.5.2024
                    if (oItem.zzvehicle !== sVehicleno) {
                        if (oItem.zztrailer === "") {
                            oItem.indicator = "D";
                        } else {
                            oItem.zzvehicle = sVehicleno;
                        }
                    }
                    // } + evkontos 10.5.2024
                } else {    // "trailer"
                    if ((oItem.zztrailer !== sVehicleno) && (oItem.zztrailer !== "")) {
                        // if ((oItem.zzvehicle !== "") && (oItem.zztrailer !== "")) {
                        oItem.indicator = "D";
                    }
                }
            });

            if ((aItems) && (aItems.length > 0)) {
                this.mStoData.setProperty(sPath, aItems);
                this.mStoData.refresh();
            }
        },

        onAfterCloseValueHelp: function () {
            this._onValueHelpRequest("Destroy").destroy();
        },

        //Set Default Fields; 
        _setDefaultValues: function (input, value) {
            var that = this;
            that.getView().setBusy(true);
            this.vInput = input;

            switch (input) {
                case "ContractNumber":
                    var sParameters = {
                        Type: input,
                        Key: value,
                        Key2: ""
                    };

                    break;
                case "ContractItem":
                    sParameters = {
                        Type: input,
                        Key: value,
                        Key2: this.getView().getModel("SalesOrder").getData().ContractNumber
                    };
                    break;
                case "DestinationID":
                    sParameters = {
                        Type: input,
                        Key: value,
                        Key2: ""
                    };
                    break;
                default:
                    break;
            }
            this.getView().getModel().callFunction("/GetDefaultValues", {
                method: "GET",
                urlParameters: sParameters,
                async: true,
                success: function (oData) {

                    that.getView().setBusy(false);

                    var sData = that.getView().getModel("SalesOrder").getData();
                    switch (that.vInput) {
                        case "ContractNumber":
                            var sVBAKDefaults = JSON.parse(oData.GetDefaultValues.Defaults);
                            sData.ContractValidTill = sVBAKDefaults.vdatu;
                            sData.CustomerCode = sVBAKDefaults.kunnr;
                            break;
                        case "ContractItem":
                            var sVBAPDefaults = JSON.parse(oData.GetDefaultValues.Defaults);
                            sData.Shipto = sVBAPDefaults.kunweAna;
                            sData.ContractItemQty = sVBAPDefaults.zmeng;
                            sData.ConsumedQty = sVBAPDefaults.kwmeng;
                            break;

                        case "DestinationID":
                            var sDestDefaults = JSON.parse(oData.GetDefaultValues.Defaults);
                            sData.SalesOrg = sDestDefaults.vkorg;
                            sData.Division = sDestDefaults.spart;
                            sData.DistChannel = sDestDefaults.vtweg;
                            sData.Plant = sDestDefaults.werks;
                            sData.SalesOrderType = sDestDefaults.auart;
                            break;

                        default:
                            break;

                    }
                    that.getView().getModel("SalesOrder").refresh();

                },
                error: function (oError) {
                    that.getView().setBusy(false);
                }
            });
        },

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */
        _onObjectMatched: function (oEvent) {
            var sObjectId = oEvent.getParameter("arguments").objectId,
                sMode = oEvent.getParameter("arguments").mode;

            /* var textModel = new JSONModel();
            var objProp = {
                "Text": "Truck/Train - Create Stock Transfer Order"
            }; */

            this.getView().byId("messagePopoverBtn").setVisible(false);
            // this.setModel(oModel, "SalesOrder");

            // var editableModel = this.getOwnerComponent().getModel("editableModel");
            // this.getView().setModel(editableModel, "editableModel");

            // var SOModel = this.getOwnerComponent().getModel("SOModel");
            // this.getView().setModel(SOModel, "SalesOrder");

            switch (sMode) {

                case "create":
                    this._createEmptyModel();
                    // this.setModel(oModel, "SalesOrder");
                    // textModel -> default from onInit
                    this.getView().getModel("textModel").setProperty("/Text", "Create Stock Transfer Order");
                    // if (Object.keys(editableModel.getData()).length === 0) {
                    // this._setEditableModel(true, true);
                    // }
                    break;

                case "display":
                    this.getView().getModel("textModel").setProperty("/Text", "Display Stock Transfer Order " + sObjectId);
                    this.getView().getModel("textModel").setProperty("/Item", "Position");
                    // // if (Object.keys(editableModel.getData()).length === 0) {
                    //     this._setEditableModel(false, false);
                    // // }
                    this._loadSTOData(sObjectId);   // + evkontos 28.4.2024
                    break;

                case "edit":
                    this.getView().getModel("textModel").setProperty("/Text", "Edit Stock Transfer Order " + sObjectId);
                    this.getView().getModel("textModel").setProperty("/Item", "Position");
                    // if (Object.keys(editableModel.getData()).length === 0) {
                    // this._setEditableModel(false, true);
                    // }
                    this._loadSTOData(sObjectId);   // + evkontos 28.4.2024
                    break;
            }

            this.mViewModel.setProperty("/mode", sMode);
            this.getView().getModel("vehicleData")?.setData([]);
            this.getView().getModel("compartmentData")?.setData([]);
        },

        /**
         * Binds the view to the object path.
         * @function
         * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
         * @private
         */
        // - evkontos 28.4.2024: refactory
        // _onObjectMatched: function (oEvent) {
        //     var sObjectId = oEvent.getParameter("arguments").objectId;
        //     var sMode = oEvent.getParameter("arguments").mode;

        //     /* var textModel = new JSONModel();
        //     var objProp = {
        //         "Text": "Truck/Train - Create Stock Transfer Order"
        //     }; */

        //     this.getView().byId("messagePopoverBtn").setVisible(false);
        //     // this.setModel(oModel, "SalesOrder");

        //     var editableModel = this.getOwnerComponent().getModel("editableModel");
        //     this.getView().setModel(editableModel, "editableModel");

        //     var SOModel = this.getOwnerComponent().getModel("SOModel");
        //     this.getView().setModel(SOModel, "SalesOrder");

        //     switch (sMode) {

        //         case "create":
        //             var oModel = new JSONModel({
        //                 werks: "",
        //                 vstel: "",
        //                 zzdestid: "",
        //                 kunnr: "",
        //                 SalesContract: "",
        //                 ContractItem: "",
        //                 Solidto: "",
        //                 vdatu: null,
        //                 ValidityDateofSO: null,
        //                 IntercompanyPartner: "",
        //                 zzvehicle: "",
        //                 zztrailer: "",
        //                 ShipToParty: "",
        //                 // SalesOrderText:"Create Sales Order - Truck/Train",
        //                 to_OrdersChangeItems: { results: [] }
        //             });
        //             this.setModel(oModel, "SalesOrder");
        //             // textModel -> default from onInit
        //             this.getView().getModel("textModel").setProperty("/Text", "Create Stock Transfer Order");
        //             // if (Object.keys(editableModel.getData()).length === 0) {
        //                 this._setEditableModel(true, true);
        //             // }
        //             break;

        //         case "display":
        //             this.getView().getModel("textModel").setProperty("/Text", "Display Stock Transfer Order " + sObjectId);
        //             this.getView().getModel("textModel").setProperty("/Item", "Position");
        //             // if (Object.keys(editableModel.getData()).length === 0) {
        //                 this._setEditableModel(false, false);
        //             // }
        //             //this._loadSTOData(sObjectId);   // + evkontos 28.4.2024
        //             break;

        //         case "edit":
        //             this.getView().getModel("textModel").setProperty("/Text", "Edit Stock Transfer Order " + sObjectId);
        //             this.getView().getModel("textModel").setProperty("/Item", "Position");
        //             // if (Object.keys(editableModel.getData()).length === 0) {
        //                 this._setEditableModel(false, true);
        //             // }
        //             //this._loadSTOData(sObjectId);   // + evkontos 28.4.2024
        //             break;
        //     }

        //     /*  var oModel = new JSONModel({
        //           werks:"",
        //           vstel: "",
        //           zzdestid: "",
        //           kunnr: "",
        //           SalesContract: "",
        //           ContractItem: "",
        //           Solidto: "",
        //           vdatu: null,
        //           ValidityDateofSO: null,
        //           IntercompanyPartner: "",
        //           zzvehicle: "",
        //           zztrailer: "",
        //           ShipToParty: "",
        //           // SalesOrderText:"Create Sales Order - Truck/Train",
        //           to_OrdersChangeItems: { results: [] }
        //       }); */

        //     // this.getView().setModel(textModel, "textModel");

        //     /* var SOModel = this.getOwnerComponent().getModel("SOModel");
        //        if (this.getOwnerComponent().getModel("SOModel").oData.ebeln !== undefined && this.getOwnerComponent().getModel("SOModel").oData.ebeln !== null) {

        //            objProp = {
        //                // "Text" : "Edit Sales Order "+  this.getOwnerComponent().getModel("SOModel").oData.SalesOrder + "- Truck/Train"
        //                "Text": "Truck/Train - Edit Stock Transfer Order " + this.getOwnerComponent().getModel("SOModel").oData.ebeln
        //            };
        //           if (this.getOwnerComponent().getModel("SOModel").oData.ContractValidityEndDate !== null && this.getOwnerComponent().getModel("SOModel").oData.ContractValidityEndDate !== undefined) {
        //                var validTillDate = this.getOwnerComponent().getModel("SOModel").oData.ContractValidityEndDate.toDateString();
        //                this.getOwnerComponent().getModel("SOModel").oData.ContractValidityEndDate = validTillDate;
        //            } 
        //            this.getView().setModel(SOModel, "SalesOrder");
        //            this.salesOrder = this.getOwnerComponent().getModel("SOModel").oData.ebeln;
        //      } */


        //     //  textModel.setData(objProp, "textModel");
        //     //   this.getView().setModel(textModel, "textModel");

        //     this.getView().getModel("vehicleData")?.setData([]);        // + indranil 19.4.2024
        //     this.getView().getModel("compartmentData")?.setData([]);    // + indranil 19.4.2024
        // },

        _createEmptyModel: function () {
            var oData = {
                ebeln: "",
                stodestid: "",
                bsart: "",
                bukrs: "",
                reswk: "",
                SupplyingPlantDescrEN: "",
                TargetLocation: "",
                TargetCustomer: "",
                ekorg: "",
                ekgrp: "",
                motid: "",
                motDescVal: "",
                zzvehicle: "",
                zz_imo: "",
                zztrailer: "",
                zzdrivercode: "",
                MaterialNo: "",
                vdatu: "",
                ReceivingPlant: "",
                lgort: "",
                reslo: "",
                Quantity: "",
                TargetQuantityUnit: "",
                valtype: "",
                oih_licin: "",
                EditMode: "",
                Incoterm: "",
                zz_cardid: "",
                zz_comp_po: "",
                zz_compcap_po: "",
                zz_compcapuom_po: "",
                zz_seal_po: "",
                zz_trailer_po: "",
                zz_vehicle_po: "",
                stoItems: []
            }
            this.mStoData.setData(oData);
        },

        // + evkontos 28.4.2024
        _loadSTOData: function (sEbeln) {
            var oModel = this.getOwnerComponent().getModel(),
                that = this;

            oModel.read("/ZMM_CDS_I_FAST_ENTRY(ebeln='" + sEbeln + "',ebelp='10')", {
                urlParameters: {
                    "$expand": "to_OrdersChangeItems"
                },
                success: function (oData, oResponse) {
                    if (oData !== undefined) {
                        var oHeader = {},
                            aItems = [];

                        oData?.to_OrdersChangeItems?.results.forEach(function (oItem) {
                            var oObj = Object.assign({}, oItem);    // create shallow copy just in case
                            aItems.push(oObj);
                            oHeader.stodestid = (oHeader.stodestid) ? oHeader.stodestid : oObj.zz_destid_po;   // get any destination from item level
                        });

                        oHeader.ebeln = oData.ebeln;
                        oHeader.Incoterm = oData.Incoterm;
                        oHeader.motid = oData.motid;
                        oHeader.motDescVal = oData.motDescVal;
                        oHeader.bsart = oData.bsart;
                        oHeader.valtype = oData.valtype;
                        oHeader.bukrs = oData.bukrs;
                        oHeader.ekorg = oData.ekorg;
                        oHeader.ekgrp = oData.ekgrp;
                        oHeader.TargetCustomer = oData.TargetCustomer;
                        oHeader.zz_cardid = oData.zz_cardid;
                        oHeader.zz_comp_po = oData.zz_comp_po;
                        oHeader.zz_compcap_po = oData.zz_compcap_po;
                        oHeader.zz_compcapuom_po = oData.zz_compcapuom_po;
                        oHeader.zz_imo = oData.zz_imo;
                        oHeader.zz_seal_po = oData.zz_seal_po;
                        oHeader.zz_trailer_po = oData.zz_trailer_po;
                        oHeader.zz_vehicle_po = oData.zz_vehicle_po;
                        oHeader.zzvehicle = oData.zzvehicle;
                        oHeader.zztrailer = oData.zztrailer;
                        oHeader.zzdrivercode = oData.zzdrivercode;
                        oHeader.zz_vendor = oData.zz_vendor;
                        oHeader.zz_driverfname = oData.zz_driverfname;
                        oHeader.zz_driverlname = oData.zz_driverlname;
                        oHeader.vdatu = oData.vdatu;
                        oHeader.ReceivingPlant = oData.ReceivingPlant;  // werks
                        oHeader.reswk = oData.reswk;    // Supplying plant
                        oHeader.SupplyingPlantDescrEN = oData.SupplyingPlantDescrEN;
                        oHeader.oih_licin = oData.oih_licin;
                        oHeader.zzhandid = oData.zzhandid;

                        oHeader.stoItems = aItems;

                        that.mStoData.setData(oHeader);
                    }
                },
                error: function (oError) {
                    console.log(JSON.stringify(oError));
                }
            });

        },

        /* _onObjectMatched: function (oEvent) {
            var oArgs = oEvent.getParameter("arguments"),
                sObjectId = oArgs.objectId,
                sMode = oArgs.mode;

            if ((sObjectId !== "new") &&  (sMode !== "create")) {
                this._fillSalesOrderModel(sObjectId);
            } else {
                // error
            }

            var S1 = this.getOwnerComponent().getModel("S1");
            this.getView().setModel(S1, "S1");

            this.getView().byId("messagePopoverBtn").setVisible(false);
            
            var editableModel = this.getOwnerComponent().getModel("editableModel");
            this.getView().setModel(editableModel, "editableModel");

            switch (sMode) {
                case "create":
                    var oModel = new JSONModel({
                        vstel: "",
                        zzdestid: "",
                        kunnr: "",
                        SalesContract: "",
                        ContractItem: "",
                        Solidto: "",
                        vdatu: null,
                        ValidityDateofSO: null,
                        IntercompanyPartner: "",
                        zzvehicle: "",
                        zztrailer: "",
                        ShipToParty: "",
                        to_OrdersChangeItems: { results: [] }
                    });
                    this.setModel(oModel, "SalesOrder");
                    // textModel -> default from onInit
                    if (Object.keys(editableModel.getData()).length === 0) {
                        this._setEditableModel(true, true);
                    }
                break;

                case "display":
                    this.getView().getModel("textModel").setProperty("/Text", "Display Sales Order " + sObjectId);
                    this.getView().getModel("textModel").setProperty("/Item", "Position");
                    if (Object.keys(editableModel.getData()).length === 0) {
                        this._setEditableModel(false, false);
                    }
                break;

                case "edit":
                    this.getView().getModel("textModel").setProperty("/Text", "Edit Sales Order " + sObjectId);
                    this.getView().getModel("textModel").setProperty("/Item", "Position");
                    if (Object.keys(editableModel.getData()).length === 0) {
                        this._setEditableModel(false, true);
                    }
                break;
            }

            this.getView().getModel("vehicleData")?.setData([]);        // + evkontos 11.4.2024
            this.getView().getModel("compartmentData")?.setData([]);    // + evkontos 11.4.2024
        }, */

        handleMessagePopoverPress: function (oEvent) {
            this.oMessagePopover.toggle(oEvent.getSource());
        },

        /* - evkontos 28.4.2024: not used
        _setEditableModel: function (TorF, onlyDisplay) {

            var editVals =
            {
                //Header Fields

                "onlyDisplay": onlyDisplay,
                "destid": TorF,
                "werks": TorF,
                "motid": TorF,
                "Incoterm": TorF,
                "zzvendor": TorF,
                "SalesOrg": TorF,
                "ContractNo": TorF,
                "zztrailer": TorF,
                "zz_cardid": TorF,
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
                "oih_licin": TorF,
                "Oihantyp": TorF,
                "Zzitbrand": TorF,
                "AddBtn": TorF
            };

            this.getView().getModel("editableModel").setData(editVals)
        }, */

        /* - evkontos 28.4.2024: not used
        buttonIconFormatter: function () {
            // var sIcon;
            // var aMessages = this.getView().getModel().oData;

            // aMessages.forEach(function (sMessage) {
            // 	switch (sMessage.type) {
            // 		case "Error":
            // 			sIcon = "sap-icon://error";
            // 			break;
            // 		case "Warning":
            // 			sIcon = sIcon !== "sap-icon://error" ? "sap-icon://alert" : sIcon;
            // 			break;
            // 		case "Success":
            // 			sIcon = sIcon !== "sap-icon://error" && sIcon !== "sap-icon://alert" ? "sap-icon://sys-enter-2" : sIcon;
            // 			break;
            // 		default:
            // 			sIcon = !sIcon ? "sap-icon://information" : sIcon;
            // 			break;
            // 	}
            // });

            return "sap-icon://information";
        }, */

        /* - evkontos 28.4.2024: not used
        buttonTypeFormatter: function () {
            // var sHighestSeverityIcon;
            // var aMessages = this.getView().getModel().oData;

            // aMessages.forEach(function (sMessage) {
            // 	switch (sMessage.type) {
            // 		case "Error":
            // 			sHighestSeverityIcon = "Negative";
            // 			break;
            // 		case "Warning":
            // 			sHighestSeverityIcon = sHighestSeverityIcon !== "Negative" ? "Critical" : sHighestSeverityIcon;
            // 			break;
            // 		case "Success":
            // 			sHighestSeverityIcon = sHighestSeverityIcon !== "Negative" && sHighestSeverityIcon !== "Critical" ?  "Success" : sHighestSeverityIcon;
            // 			break;
            // 		default:
            // 			sHighestSeverityIcon = !sHighestSeverityIcon ? "Neutral" : sHighestSeverityIcon;
            // 			break;
            // 	}
            // });
            return "Neutral";
        }, */

        /* - evkontos 28.4.2024: not used
        highestSeverityMessages: function () {
            var sHighestSeverityIconType = this.buttonTypeFormatter();
            var sHighestSeverityMessageType;

            switch (sHighestSeverityIconType) {
                case "Negative":
                    sHighestSeverityMessageType = "Error";
                    break;
                case "Critical":
                    sHighestSeverityMessageType = "Warning";
                    break;
                case "Success":
                    sHighestSeverityMessageType = "Success";
                    break;
                default:
                    sHighestSeverityMessageType = !sHighestSeverityMessageType ? "Information" : sHighestSeverityMessageType;
                    break;
            }

            return this.getView().getModel().oData.reduce(function (iNumberOfMessages, oMessageItem) {
                return oMessageItem.type === sHighestSeverityMessageType ? ++iNumberOfMessages : iNumberOfMessages;
            }, 0);
        }, */

        onValueHelpRequest: function (oEvent) {

            //Get EntitySet Name from the F4 Input Box 
            var entitySet = oEvent.getSource().getCustomData()[0].getValue("entitySet");
            //Get EntitySet Name from the F4 Input Box and set to Model

            var InitiallyVisibleFields;
            var searchHelpText; // + evkontos 16.4.2024

            this.currentEditingPath = oEvent.getSource().getBindingContext("stoData")?.getPath() || ""; // + evkontos 24.4.2024
            if (this.bClearButtonPressed) {
                this.bClearButtonPressed = false;
                return;
            }

            switch (entitySet) {
                // Destination ID
                case "ZMM_CDS_B_DESTINATIONID_VH":
                    // InitiallyVisibleFields = "destid,ekorg,vstel,umwrk,werks,ekorg,ekgrp,bukrs"; // - evkontos 16.4.2024
                    InitiallyVisibleFields = "destid,bsart,ekorg,PurchOrgDescr,vstel,umwrk,ReceivingPlantDescrEN,ReceivingPlantDescrGR,werks,SupplyingPlantDescrEN,SupplyingPlantDescrGR,ekgrp,PurchGroupDescr,bukrs,CompanyName" // + evkontos 16.4.2024
                    break;

                //Receiving Plant
                case "ZMM_CDS_B_RECEIVEPLANT_VH":
                    InitiallyVisibleFields = "werks,werksDescEN,werksDescGR,SupplyingPlant,SupplyingPlantDescEN,SupplyingPlantDescGR,destid,vstel";
                    break;

                //Driver ID 
                case "DriverVHSet":
                    InitiallyVisibleFields = "Driverid,Firstname,Lastname,Islocked";
                    searchHelpText = "Driver ID"    // + evkontos 16.4.2024
                    break;

                case "VehicleVHSet":
                    InitiallyVisibleFields = "Vehicleno,Vehicletype,Islocked";
                    searchHelpText = "Vehicle ID"
                    break;

                //Material Number
                case "ZMM_CDS_B_MATERIAL_VH":
                    InitiallyVisibleFields = "matnr,werks,maktx,name1,mtbez"
                    break;

                //valuation type
                case "ZMM_CDS_B_VALTYPE_VH":
                    InitiallyVisibleFields = "bwtar,matnr,maktx"
                    break;

                case "ZSD_CDS_B_CARRIER_VH":
                    InitiallyVisibleFields = "Supplier,SupplierName,CountryCode,CompanyCode,PurchaseOrganization"
                    searchHelpText = "Suppliers";
                    break;

                case "C_MM_IncotermValueHelp":
                    InitiallyVisibleFields = "IncotermsClassification,IncotermsClassificationName"
                    break;

                case "ZMM_CDS_B_MODEOFTRANSPORT_VH":
                    InitiallyVisibleFields = "vktra,bezei"
                    break;

                case "ZMM_CDS_B_LICENSE_VH":
                    InitiallyVisibleFields = "licin,lictp,matnr,certf1"
                    break;

                /* not used
                case "ZSD_CDS_B_CONTRACT_VH":
                    InitiallyVisibleFields = "SalesContract,SalesOrganization,DistributionChannel,OrganizationDivision,SalesContractValidityEndDate,SoldToParty,SoldToPartyName,SoldToPartyLand,ShipToParty,ShipToPartyName,ShipToPartyLand,bukrs_vf,bstnk";
                    break; */

                /* not used
                case "ZSD_CDS_B_ShipTo_VH":
                    InitiallyVisibleFields = "ShipToParty,ShipToPartyName,ShipToPartyLand";
                    break; */

                /* not used //Supplying Plant
                case "ZMM_CDS_B_SUPPLYPLANT_VH":
                    InitiallyVisibleFields = "werks,werksDescEN,werksDescGR";
                    break; */

                /* not used
                case "ZSD_CDS_B_TL_DEST":
                    InitiallyVisibleFields = "Destid,Desttext,Vstel,Werks,WerksName,IsLand";
                    break; */

                /* not used
                case "ZSD_CDS_B_FAST_ENTRY_ITEMS":
                    InitiallyVisibleFields = "SalesContractItem,SalesContract,TargetQuantity,ContractOrderQuantity,OpenContractQuantity,matnr"
                    break; */

                /* not used
                case "I_UnitOfMeasure":
                    InitiallyVisibleFields = "UnitOfMeasure,UnitOfMeasure_Text"
                    break; */

                /* not used
                case "ZSD_CDS_B_TL_DEST2":
                    InitiallyVisibleFields = "Vstel,Destid,Werks,WerksName,Desttext,IsLand,Vkorg,VkorgDesc,Vtweg,VtwegDesc,Spart,SpartDesc,Auart,AuartDesc"
                    break; */

                /* not used
                case "ZSD_CDS_B_ShippingType_VH":
                    InitiallyVisibleFields = "ShippingType,ShippingTypeDesc,ModeOfTransport,ModeOfTransportDesc"
                    break; */


                case "ZSD_CDS_B_HANDID_VH":
                    InitiallyVisibleFields = "HandID,HandIDDesc"
                    break;

                // case "C_MM_IncotermValueHelp":
                //    InitiallyVisibleFields = "IncotermsClassification,IncotermsVersion,IncotermsClassificationName,LocationIsMandatory"
                //    break;


                case "ZSD_CDS_B_HANDLINGTYPE_VH":
                    InitiallyVisibleFields = "HandlingType,HandlingTypeDesc,HandID"
                    break;

                /* not used
                case "ZSD_CDS_B_IntPartner_VH":
                    InitiallyVisibleFields = "IntercompanyPartner,IntercompanyPartnerName,land1"
                    break; */

                default:
                    break;
            }
            this.getView().getModel("smartValueHelpModel").setProperty("/EntitySet", entitySet);
            this.getView().getModel("smartValueHelpModel").setProperty("/InitiallyVisibleFields", InitiallyVisibleFields);

            // this.getOwnerComponent().getModel("searchHelpTextModel").setProperty("/searchHelpText", searchHelpText); // + evkontos 16.4.2024

            var oView = this.getView();

            if (!this._pValueHelpDialog) {
                this._pValueHelpDialog = Fragment.load({
                    id: oView.getId(),
                    name: "sto.fragment.smart",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }
            this._pValueHelpDialog.then(function (oDialog) {
                oDialog.open();
            });

            // issey ni hora :(, Dialog shud be dependant on view :(
            // this._pValueHelpDialog = sap.ui.xmlfragment("sto.fragment.smart", this);
            // this._pValueHelpDialog.setModel(this.getView().getModel());
            // this._pValueHelpDialog.open();

        },

        // onCancelValueHelp: function () {
        //     this.byId("selectDialog").close();
        //     this._pValueHelpDialog.destroy;
        //     this._pValueHelpDialog = null;
        //     this._vValueHelpDialog = null; // + evkontos 24.4.2024
        // //    this.getView().destroyDependents();
        // },

        onSelectValueHelp: function (oEvent) {
            var selectedValue = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[0].mProperties.text;
            var entitySet = this.getView().getModel("smartValueHelpModel").getProperty("/EntitySet"),
                oSelectedItem = this.getView().byId('idPOSchedulePage_table0').getSelectedItem(),
                oSelectedContext = oSelectedItem.getBindingContext();

            switch (entitySet) {
                //DestId
                case "ZMM_CDS_B_DESTINATIONID_VH":
                    // { - evkontos 16.4.2024: refactoring
                    // this.getView().getModel("SalesOrder").setProperty("/stodestid", selectedValue);

                    // var purchOrg = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[1].mProperties.text;
                    // this.getView().getModel("SalesOrder").setProperty("/PurchasingOrg", purchOrg);

                    // var purchGrp = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[9].mProperties.text; // evkontos 16.4.2024: 5 -> 9
                    // this.getView().getModel("SalesOrder").setProperty("/PurchasingGrp", purchGrp);

                    // var CompanyCode = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[10].mProperties.text; // evkontos 16.4.2024: 6 -> 10
                    // this.getView().getModel("SalesOrder").setProperty("/CompCode", CompanyCode);

                    // var splantfromdest = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[6].mProperties.text; // evkontos 16.4.2024: 4 -> 6
                    // this.getView().getModel("SalesOrder").setProperty("/splantfilter", splantfromdest);
                    // } - evkontos 16.4.2024: refactoring

                    // { + evkontos 16.4.2024: refactoring
                    var oSelectedContext = this.getView().byId("idPOSchedulePage_table0").getSelectedItem().getBindingContext(),

                        sCompany = oSelectedContext.getProperty("bukrs"),
                        sCompanyName = oSelectedContext.getProperty("CompanyName"),

                        sPurchGroup = oSelectedContext.getProperty("ekgrp"),
                        sPurchGroupDescr = oSelectedContext.getProperty("PurchGroupDescr"),

                        sPurchOrg = oSelectedContext.getProperty("ekorg"),
                        sPurchOrgDescr = oSelectedContext.getProperty("PurchOrgDescr"),

                        sSupplyingPlant = oSelectedContext.getProperty("werks"),
                        sSupplyingPlantDescr = oSelectedContext.getProperty("SupplyingPlantDescrEN"),

                        sPurchDocType = oSelectedContext.getProperty("bsart") || "ZH90";
                    //sSupplyingPlantDescr = oSelectedContext.getProperty("PurchOrgDescr");

                    this.mStoData.setProperty("/stodestid", selectedValue);

                    this.mStoData.setProperty("/reswk", sSupplyingPlant);
                    this.mStoData.setProperty("/SupplyingPlantDescrEN", sSupplyingPlantDescr);

                    this.mStoData.setProperty("/bukrs", sCompany);
                    this.mStoData.setProperty("/CompanyName", sCompanyName);

                    this.mStoData.setProperty("/ekgrp", sPurchGroup);
                    this.mStoData.setProperty("/PurchGroupDescr", sPurchGroupDescr);

                    this.mStoData.setProperty("/ekorg", sPurchOrg);
                    this.mStoData.setProperty("/PurchOrgDescr", sPurchOrgDescr);

                    this.mStoData.setProperty("/bsart", sPurchDocType);

                    this._deleteRecPlants();

                    break;
                // } + evkontos 16.4.2024

                //Valuation Type
                case "ZMM_CDS_B_VALTYPE_VH":
                    // var path = this.getView().getModel("SalesOrder").getData().to_OrdersChangeItems.results.length - 1;  // - evkontos 25.4.2024
                    // this.getView().getModel("SalesOrder").setProperty("/to_OrdersChangeItems/results/" + path + "/ValuationType", selectedValue);  // - evkontos 25.4.2024
                    this.mStoData.setProperty(this.currentEditingPath + "/bwtar", selectedValue);  // + evkontos 25.4.2024
                    break;

                //Driver ID
                case "DriverVHSet":
                    this.mStoData.setProperty("/zzdrivercode", selectedValue);
                    var driverFname = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[1].mProperties.text;
                    var driverLname = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[2].mProperties.text;
                    this.mStoData.setProperty("/zz_driverfname", driverFname);
                    this.mStoData.setProperty("/zz_driverlname", driverLname);
                    break;

                case "ZMM_CDS_B_MATERIAL_VH":
                    this.mStoData.setProperty(this.currentEditingPath + "/matnr", selectedValue);
                    this.contract_Matnr = selectedValue;

                    var fQty = this.mStoData.getProperty(this.currentEditingPath + "/menge"),
                        sUom = this.mStoData.getProperty(this.currentEditingPath + "/meins"),
                        sCompUom = this.mStoData.getProperty(this.currentEditingPath + "/zz_compcapuom_po"),
                        oTable = this.getView().getContent()[0].getContent().getItems()[1],
                        that = this;

                    if ((!!(this.contract_Matnr)) && (!!(fQty)) && (!!(sUom)) && (sUom !== sCompUom)) {
                        oTable.setBusy(true);
                        this._convertUom(this.contract_Matnr, fQty, sUom, sCompUom).then(function (fConvQty) {
                            this.mStoData.setProperty(that.currentEditingPath + "/TargetQuantityConv", fConvQty);
                            oTable.setBusy(false);
                        },
                            function (error) {
                                MessageBox.error(error);
                                oTable.setBusy(false);
                            }.bind(that));
                    } else {
                        this.mStoData.setProperty(this.currentEditingPath + "/TargetQuantityConv", "");
                    }
                    break;

                //Incoterm
                case "C_MM_IncotermValueHelp":
                    this.mStoData.setProperty("/Incoterm", selectedValue);
                    break;

                case "ZMM_CDS_B_LICENSE_VH":
                    // var path = this.getView().getModel("SalesOrder").getData().to_OrdersChangeItems.results.length - 1;  // - evkontos 25.4.2024
                    // this.getView().getModel("SalesOrder").setProperty("/to_OrdersChangeItems/results/" + path + "/oih_licin", selectedValue);  // - evkontos 25.4.2024
                    this.mStoData.setProperty(this.currentEditingPath + "/oih_licin", selectedValue);  // + evkontos 25.4.2024
                    break;

                case "ZSD_CDS_B_CARRIER_VH":
                    this.mStoData.setProperty("/zzvendor", selectedValue);
                    var Supp_Name = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[1].mProperties.text;
                    var Supp_Land = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[2].mProperties.text;
                    this.mStoData.setProperty("/zzvendorLand", Supp_Land);
                    this.mStoData.setProperty("/zzvendorName", Supp_Name);
                    break;

                //Receiving Plant
                case "ZMM_CDS_B_RECEIVEPLANT_VH":
                    // var path = this.getView().getModel("SalesOrder").getData().to_OrdersChangeItems.results.length - 1;  // - evkontos 25.4.2024
                    // this.getView().getModel("SalesOrder").setProperty("/to_OrdersChangeItems/results/" + path + "/Plant", selectedValue);  // - evkontos 25.4.2024
                    var recPlantDescVal1 = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[1].mProperties.text;
                    // this.getView().getModel("SalesOrder").setProperty("/to_OrdersChangeItems/results/" + path + "/werksDesc", recPlantDescVal1);  // - evkontos 25.4.2024

                    this.mStoData.setProperty(this.currentEditingPath + "/werks", selectedValue);  // + evkontos 25.4.2024
                    this.mStoData.setProperty(this.currentEditingPath + "/werksDesc", recPlantDescVal1);  // + evkontos 25.4.2024
                    break;

                case "ZMM_CDS_B_MODEOFTRANSPORT_VH":
                    this.mStoData.setProperty("/motid", selectedValue);
                    var motDescVal1 = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[1].mProperties.text;
                    this.mStoData.setProperty("/motDescVal", motDescVal1);
                    break;

                /* not used
                case "ZSD_CDS_B_CONTRACT_VH":
                    this.getView().getModel("SalesOrder").setProperty("/SalesContract", selectedValue);

                    var validTill = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[4].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/ContractValidityEndDate", validTill);

                    var SalesOrganization = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[1].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/SalesOrganization", SalesOrganization);
                    var DistributionChannel = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[2].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/DistributionChannel", DistributionChannel);
                    var OrganizationDivision = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[3].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/OrganizationDivision", OrganizationDivision);

                    var soldtp = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[5].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/kunnr", soldtp);
                    var SoldToName = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[6].mProperties.text;
                    var SoldToLand = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[7].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/name1", SoldToName + ", " + SoldToLand);
                    // this.getView().getModel("SalesOrder").setProperty("/ShiptoLand", shipToPartyLand);
                    this.contract_SalesOrganization = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[1].mProperties.text;
                    this.contract_DistributionChannel = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[2].mProperties.text;
                    this.contract_OrganizationDivision = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[3].mProperties.text;
                    this.contract_bukrs = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[11].mProperties.text;

                    //For Matnr and contract item Search Help
                    var model = this.getOwnerComponent().getModel();
                    var that = this;

                    model.read("/ZSD_CDS_B_FAST_ENTRY_ITEMS", {
                        filters: [
                            new sap.ui.model.Filter({
                                path: "SalesContract",
                                operator: sap.ui.model.FilterOperator.EQ,
                                value1: selectedValue
                            })],
                        success: function (oData, oResponse) {
                            if (oData !== undefined) {
                                var S1 = that.getOwnerComponent().getModel("S1");
                                S1.setData(oData);
                                that.getView().setModel(S1, "S1");
                            }
                        },
                        error: function (oError) {
                            // alert("Read ERROR");
                        }
                    });
                    //For Matnr and contract item Search Help


                    break; */

                /* not used
                case "ZSD_CDS_B_FAST_ENTRY_ITEMS":
                    var path = this.getView().getModel("SalesOrder").getData().to_OrdersChangeItems.results.length - 1;
                    this.getView().getModel("SalesOrder").setProperty("/to_OrdersChangeItems/results/" + path + "/SalesOrderItem", selectedValue);
                    if (this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[2].getAggregation("items") !== null) {
                        var ContractOrderQuant = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[2].getAggregation("items")[0].getProperty("text");
                        var ContractOrderQ = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[2].getAggregation("items")[1].getProperty("text");
                        this.getView().getModel("SalesOrder").setProperty("/to_OrdersChangeItems/results/" + path + "/ContractOrderQuantity", ContractOrderQuant);
                        this.getView().getModel("SalesOrder").setProperty("/to_OrdersChangeItems/results/" + path + "/ContractTargetQuantityUnit", ContractOrderQ);
                    }

                    if (this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[3].getAggregation("items") !== null) {
                        var openqty = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[4].getAggregation("items")[0].getProperty("text");
                        var openqtyQ = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[4].getAggregation("items")[1].getProperty("text");
                        this.getView().getModel("SalesOrder").setProperty("/to_OrdersChangeItems/results/" + path + "/OpenContractQuantity", openqty);
                    }

                    if (this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[3].getAggregation("items") !== null) {
                        var ConsumedQty = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[3].getAggregation("items")[0].getProperty("text");
                        var ConsumedQtyQ = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[3].getAggregation("items")[1].getProperty("text");
                        this.getView().getModel("SalesOrder").setProperty("/to_OrdersChangeItems/results/" + path + "/ContractTargetQuantity", ConsumedQty);
                    }

                    this.contract_Matnr = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[5].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/to_OrdersChangeItems/results/" + path + "/matnr", this.contract_Matnr);
                    break; */

                /* not used
                case "I_UnitOfMeasure":
                    this.getView().getModel("SalesOrder").setProperty("/UnitOfMeasure", selectedValue);
                    break; */

                //Intercompany Partner 
                // case "":
                //     this.getView().getModel("SalesOrder").setProperty("/UnitOfMeasure", selectedValue);
                //     break;


                //Vehicle ID
                /*    case "VehicleVHSet":
                    this.getView().getModel("SalesOrder").setProperty("/zzvehicle", selectedValue);
                    var vehicleID = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[0].mProperties.text;
                  //  var driverLname = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[2].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/zzvehicle", vehicleID);
                   // this.getView().getModel("SalesOrder").setProperty("/zzdriverlname", driverLname);
                    break; */

                //Material
                /* case "ZMM_CDS_B_MATERIAL_VH":
                    // this.getView().getModel("SalesOrder").setProperty("/materialno", selectedValue);
                    var path = this.getView().getModel("SalesOrder").getData().to_OrdersChangeItems.results.length - 1;
                    this.getView().getModel("SalesOrder").setProperty("/to_OrdersChangeItems/results/" + path + "/Material", selectedValue);
                    break; */

                /* not used //LP
                case "ZSD_CDS_B_ShipTo_VH":
                    this.mStoData.setProperty("/ShipToParty", selectedValue);
                    var shipToPartyName = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[1].mProperties.text;
                    var shipToPartyLand = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[2].mProperties.text;
                    this.mStoData.setProperty("/ShipToPartyName", shipToPartyName + ", " + shipToPartyLand);
                    break; */


                case "ZSD_CDS_B_HANDLINGTYPE_VH":
                    // var path = this.getView().getModel("SalesOrder").getData().to_OrdersChangeItems.results.length - 1;  // - evkontos 25.4.2024
                    // this.getView().getModel("SalesOrder").setProperty("/to_OrdersChangeItems/results/" + path + "/oihantyp", selectedValue);  // - evkontos 25.4.2024
                    this.mStoData.setProperty(this.currentEditingPath + "/oihantyp", selectedValue);  // + evkontos 25.4.2024
                    break;

                /* not used //LP
                case "ZSD_CDS_B_TL_DEST2":
                    this.getView().getModel("SalesOrder").setProperty("/vstel", selectedValue);
                    var salesOrg = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[6].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/vkorg", salesOrg);
                    var salesOrgDesc = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[7].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/VkorgDesc", salesOrgDesc);
                    var distrinChannel = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[8].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/vtweg", distrinChannel);
                    var distrinChannelDesc = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[9].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/VtwegDesc", distrinChannelDesc);
                    var division = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[10].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/spart", division);
                    var divisionDesc = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[11].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/SpartDesc", divisionDesc);
                    var docType = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[12].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/auart", docType);
                    var docTypeDesc = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[13].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/AuartDesc", docTypeDesc);
                    var plant = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[2].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/werks", plant);
                    var plantname = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[3].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/WerksDesc", plantname);
                    break; */

                /* not used //DestId
                case "ZSD_CDS_B_ShippingType_VH":
                    var shipTypeSelected = selectedValue;
                    this.getView().getModel("SalesOrder").setProperty("/ShippingType", shipTypeSelected);
                    var shippingTypeDesc = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[1].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/ShippingTypeDesc", shippingTypeDesc);
                    var mot = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[2].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/mot", mot);
                    var motDesc = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[3].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/motDesc", motDesc);
                    break; */

                /* duplicate
                case "C_MM_IncotermValueHelp":
                    // var path = this.getView().getModel("SalesOrder").getData().to_OrdersChangeItems.results.length - 1;  // - evkontos 25.4.2024
                    // this.getView().getModel("SalesOrder").setProperty("/to_OrdersChangeItems/results/" + path + "/inco1", selectedValue);  // - evkontos 25.4.2024
                    this.mStoData.setProperty(this.currentEditingPath + "/Incorerm", selectedValue);  // + evkontos 25.4.2024
                    break; */

                /* not used
                case "ZMM_CDS_B_SUPPLYPLANT_VH":
                    var supplyingPlantSelected = selectedValue;
                    this.getView().getModel("SalesOrder").setProperty("/reswk", supplyingPlantSelected);
                    var suppPlantDescVal1 = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[1].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/SupplyingPlantDescrEN", suppPlantDescVal1);
                    break; */
                /* 
                var shippingTypeDesc = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[1].mProperties.text;
                this.getView().getModel("SalesOrder").setProperty("/ShippingTypeDesc", shippingTypeDesc);
                var mot = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[2].mProperties.text;
                this.getView().getModel("SalesOrder").setProperty("/mot", mot);
                var motDesc = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[3].mProperties.text;
                this.getView().getModel("SalesOrder").setProperty("/motDesc", motDesc);
                */
                // break;


                case "ZSD_CDS_B_HANDID_VH":
                    this.mStoData.setProperty("/zzhandid", selectedValue);
                    var HandIdDesc = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[1].mProperties.text;
                    this.mStoData.setProperty("/zzhandid_desc", HandIdDesc);
                    break;

                /* not used
                case "ZSD_CDS_B_IntPartner_VH":
                    this.getView().getModel("SalesOrder").setProperty("/IntercompanyPartner", selectedValue);
                    var IntercompanyPartnerLand = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[2].mProperties.text;
                    // this.getView().getModel("SalesOrder").setProperty("/IntercompanyPartnerLand", IntercompanyPartnerLand);
                    var IntercompanyPartnerName = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[1].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/IntercompanyPartnerName", IntercompanyPartnerName + ", " + IntercompanyPartnerLand);
                    break; */
                default:
                    break;
            }

            this.byId("selectDialog").close();

            //To Destroy the dependants on View 
            //i338362 removing because done anyway in onSelectDialogAfterClose
            // this._pValueHelpDialog.destroy;
            // this._pValueHelpDialog = null;
            // this._vValueHelpDialog = null; // + evkontos 24.4.2024
            //    this.getView().destroyDependents();
        },

        // + evkontos 25.4.2024
        onSelectDialogAfterClose: function (oEvent) {
            this._pValueHelpDialog.destroy;
            this._pValueHelpDialog = null;
            this._vValueHelpDialog = null;
            //I338362, only destory the value helps so we don't get duplicate id error when navigating
            var oDependants = this.getView().getDependents().slice(1);
            this.destoryDependants(oDependants);
            // //this.getView().destroyDependents();
        },

        destoryDependants: function (oDependants) {
            for (var i = 0; i < oDependants.length; i++) {
                oDependants[i].destroy();
            }

        },

        // + evkontos 20.4.2024
        onMaterialQtyUoMChange: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext("stoData"),
                sContextPath = oContext.getPath(),
                sMaterial = oContext.getProperty("matnr"),
                fQty = oContext.getProperty("menge"),
                sUom = oContext.getProperty("meins"),
                sPrevUom = oEvent.getParameter("previousSelectedItem")?.getProperty("key"),
                sCompUom = oContext.getProperty("zz_compcapuom_po"),    // + evkontos 25.4.2024
                oTable = this.getView().getContent()[0].getContent().getItems()[1],
                that = this;

            // if ((!!(sMaterial)) && (!!(fQty)) && (!!(sUom)) && (sUom !== sPrevUom) && (sPrevUom)) {  // - evkontos 25.4.2024
            if ((!!(sMaterial)) && (!!(fQty)) && (!!(sUom)) && (sUom !== sCompUom) && (sCompUom)) {     // + evkontos 25.4.2024
                oTable.setBusy(true);
                // this._convertUom(sMaterial, fQty, sUom, sPrevUom).then(function (fConvQty) { // - evkontos 25.4.2024
                this._convertUom(sMaterial, fQty, sUom, sCompUom).then(function (fConvQty) {    // + evkontos 25.4.2024
                    that.mStoData.setProperty(sContextPath + "/TargetQuantityConv", fConvQty);
                    oTable.setBusy(false);
                },
                    function (error) {
                        MessageBox.error(error);
                        oTable.setBusy(false);
                    }.bind(that));
            } else {
                that.mStoData.setProperty(sContextPath + "/TargetQuantityConv", "");
            }
        },

        // + evkontos 25.4.2024
        _deleteRecPlants: function () {
            var aItems = this.mStoData.getProperty("/stoItems/"),
                that = this;

            aItems.forEach(function (oItem, iIndex) {
                that.mStoData.setProperty("/stoItems/" + iIndex + "/werks", "");
                that.mStoData.setProperty("/stoItems/" + iIndex + "/werksDesc", "");
            });
        },

        _convertUom: function (sMaterial, fQty, sUomFrom, sUomTo) {
            var oParams = {
                InMeins: sUomFrom,
                Matnr: sMaterial,
                Menge: fQty,
                OutMeins: sUomTo
            },
                that = this;

            return new Promise(function (resolve, reject) {
                that.getView().getModel().callFunction("/ConvertMaterialUnit", {
                    method: "GET",
                    urlParameters: oParams,
                    success: function (oData, response) {

                        if (Boolean(+oData?.ConvertMaterialUnit?.Subrc)) {
                            reject(oData?.ConvertMaterialUnit?.Message);
                        } else {
                            resolve(+oData?.ConvertMaterialUnit?.TargetQuantity);
                        }
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                });
            });
        },

        onVehicleValueHelpRequest: function (oEvent) {
            var oView = this.getView(),
                sVehicleType = oEvent.getSource().data("vehicleType"),
                that = this;

            if (!this._vValueHelpDialog) {
                this._vValueHelpDialog = Fragment.load({
                    id: oView.getId(),
                    name: "sto.fragment.VehicleValueHelpDialog",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }
            this._vValueHelpDialog.then(function (oDialog) {
                oDialog.open();
                oDialog.setBusy(true);
                that.loadVehicleData(oDialog, sVehicleType);
            });
        },

        loadVehicleData: function (oDialog, sVehicleType) {
            var aFilters = [],
                oView = this.getView(),
                oModel = this.getOwnerComponent().getModel(),
                sPath = "/VehicleVHSet",
                oI18n = this.getView().getModel("i18n")?.getResourceBundle(),
                sDialogTitle = oI18n.getText("Vehicle");

            if (sVehicleType === "trail") {
                sDialogTitle = oI18n.getText("Trailer");
            }

            oDialog.setTitle(sDialogTitle);

            this.getView().getModel("vehicleData")?.setData([]);
            // if (this.getView().getModel("vehicleData")?.getData().length > 0) {
            //     oDialog.setBusy(false);
            // } else {
            aFilters.push(new sap.ui.model.Filter("Vehicletype", FilterOperator.EQ, sVehicleType));

            oModel.read(sPath, {
                filters: aFilters,
                urlParameters: {
                    "$expand": "toVehicleVHCopartment"
                },
                success: function (oData, oResponse) {
                    oView.getModel("vehicleData").setData(oData?.results);
                    // oInput.setValue()
                    oDialog.setBusy(false);
                },
                error: function (oError) {
                    console.log("error");
                    oDialog.setBusy(false);
                }
            });
            // }
        },

        onVehicleSearch: function (oEvent) {
            var sValue = oEvent.getParameter("value"),
                oFilter = new sap.ui.model.Filter("Vehicleno", FilterOperator.Contains, sValue),
                oBinding = oEvent.getParameter("itemsBinding");
            oBinding.filter([oFilter]);
        },

        onVehicleCancel: function (oEvent) {
            oEvent.getSource().getBinding("items").filter(null);
        },

        onVehicleConfirm: function (oEvent) {
            var oContext = oEvent.getParameter("selectedItem").getBindingContext("vehicleData"),
                sVehicleno = oContext.getProperty("Vehicleno"),
                sVehicletype = oContext.getProperty("Vehicletype"),
                aCompartments = oContext.getProperty("toVehicleVHCopartment").results,
                bLocked = oContext.getProperty("Islocked"),
                oI18n = this.getView().getModel("i18n")?.getResourceBundle(),
                sProperty = sVehicletype === "truck" ? "zzvehicle" : "zztrailer";

            if (bLocked) {
                MessageBox.information(oI18n.getText("lockedVehicleError", [sVehicletype]));
            } else {
                if (this.mStoData.getProperty("/" + sProperty) !== sVehicleno) {
                    this.mStoData.setProperty("/" + sProperty, sVehicleno);
                    this.getView().getModel("compartmentData").setData(aCompartments);
                    this.deleteOldLines(sVehicleno, sVehicletype);
                    this.addNewLines(aCompartments, sVehicletype);
                }
            }

            oEvent.getSource().getBinding("items").filter(null);
        },

        beforeGo: function (oEvent) {
            var entitySet, oBindingParams, startFilter;
            entitySet = this.getView().getModel("smartValueHelpModel").getProperty("/EntitySet");
            switch (entitySet) {
                /* not used
                case "ZSD_CDS_B_FAST_ENTRY_ITEMS":
                    var salesContract = this.getView().getModel("SalesOrder").getProperty("/SalesContract");
                    var oBindingParams = oEvent.getParameter("bindingParams");
                    var startFilter = new sap.ui.model.Filter("SalesContract", "EQ", salesContract);
                    oBindingParams.filters.push(startFilter);
                    break; */

                /* not used
                case "ZSD_CDS_B_ShippingType_VH":
                    var oBindingParams = oEvent.getParameter("bindingParams");
                    var startFilter = new sap.ui.model.Filter("ModeOfTransport", "EQ", '01');
                    var startFilter1 = new sap.ui.model.Filter("ModeOfTransport", "EQ", '02');
                    oBindingParams.filters.push(startFilter);
                    oBindingParams.filters.push(startFilter1);
                    break; */

                /* not used
                case "ZSD_CDS_B_ShipTo_VH":
                    var oBindingParams = oEvent.getParameter("bindingParams");
                    var customerCode = this.getView().getModel("SalesOrder").getProperty("/kunnr");
                    var startFilter1 = new sap.ui.model.Filter("SalesOrganization", "EQ", this.contract_SalesOrganization);
                    var startFilter2 = new sap.ui.model.Filter("DistributionChannel", "EQ", this.contract_DistributionChannel);
                    var startFilter3 = new sap.ui.model.Filter("OrganizationDivision", "EQ", this.contract_OrganizationDivision);
                    var startFilter4 = new sap.ui.model.Filter("partner", "EQ", customerCode);
                    var startFilter5 = new sap.ui.model.Filter("PartnerFunction", "EQ", 'SH');

                    oBindingParams.filters.push(startFilter1);
                    oBindingParams.filters.push(startFilter2);
                    oBindingParams.filters.push(startFilter3);
                    oBindingParams.filters.push(startFilter4);
                    oBindingParams.filters.push(startFilter5);
                    break; */

                /* not used
                case "ZSD_CDS_B_TL_DEST":
                    var oBindingParams = oEvent.getParameter("bindingParams");
                    var startFilter1 = new sap.ui.model.Filter("Vkorg", "EQ", this.contract_SalesOrganization);
                    var startFilter2 = new sap.ui.model.Filter("Vtweg", "EQ", this.contract_DistributionChannel);
                    var startFilter3 = new sap.ui.model.Filter("Spart", "EQ", this.contract_OrganizationDivision);
                    oBindingParams.filters.push(startFilter1);
                    oBindingParams.filters.push(startFilter2);
                    oBindingParams.filters.push(startFilter3);
                    break;*/

                /* not used
                case "ZSD_CDS_B_TL_DEST2":
                    var dest = this.getView().getModel("SalesOrder").getProperty("/zzdestid");
                    var oBindingParams = oEvent.getParameter("bindingParams");
                    var startFilter = new sap.ui.model.Filter("Destid", "EQ", dest);
                    oBindingParams.filters.push(startFilter);
                    break; */

                case "ZMM_CDS_B_LICENSE_VH":
                    this.onLicenseVHFilter(oEvent, this);
                    // var oBindingParams = oEvent.getParameter("bindingParams");

                    // var matnr = this.mStoData.getProperty(this.currentEditingPath + "/matnr")
                    // var matnrFilter1 = new sap.ui.model.Filter("matnr", "EQ", matnr);
                    // oBindingParams.filters.push(matnrFilter1);

                    // var CompCode = this.mStoData.getProperty("/bukrs");
                    // var CompCodeFilter2 = new sap.ui.model.Filter("bukrs_vf", "EQ", CompCode);
                    // oBindingParams.filters.push(CompCodeFilter2);

                    // var customer = this.mStoData.getProperty("/ReceivingPlant");
                    // var customerFilter3 = new sap.ui.model.Filter("kunnr", "EQ", shipTo);
                    // oBindingParams.filters.push(customerFilter3);

                    // var Plant = this.mStoData.getProperty("/reswk")
                    // var PlantFilter4 = new sap.ui.model.Filter("werks", "EQ", Plant);
                    // oBindingParams.filters.push(PlantFilter4);

                    break;


                case "ZSD_CDS_B_HANDLINGTYPE_VH":
                    var oBindingParams = oEvent.getParameter("bindingParams");
                    var HandleId = this.mStoData.getProperty("/zzhandid");
                    var startFilter1 = new sap.ui.model.Filter("HandID", "EQ", HandleId);
                    oBindingParams.filters.push(startFilter1);
                    break;

                /* not used
                case "ZSD_CDS_B_IntPartner_VH":
                    var SalesOrganization = this.getView().getModel("SalesOrder").getProperty("/SalesOrganization");
                    var DistributionChannel = this.getView().getModel("SalesOrder").getProperty("/DistributionChannel");
                    var OrganizationDivision = this.getView().getModel("SalesOrder").getProperty("/OrganizationDivision");
                    var soldtp = this.getView().getModel("SalesOrder").getProperty("/kunnr");
                    var oBindingParams = oEvent.getParameter("bindingParams");
                    var startFilter1 = new sap.ui.model.Filter("partner", "EQ", soldtp);
                    oBindingParams.filters.push(startFilter1);
                    var startFilter2 = new sap.ui.model.Filter("SalesOrganization", "EQ", SalesOrganization);
                    oBindingParams.filters.push(startFilter2);
                    var startFilter3 = new sap.ui.model.Filter("DistributionChannel", "EQ", DistributionChannel);
                    oBindingParams.filters.push(startFilter3);
                    var startFilter4 = new sap.ui.model.Filter("OrganizationDivision", "EQ", OrganizationDivision);
                    oBindingParams.filters.push(startFilter4);
                    var startFilter5 = new sap.ui.model.Filter("PartnerFunction", "EQ", "ZH");
                    oBindingParams.filters.push(startFilter5);
                    break; */

                /* not used
                case "ZMM_CDS_B_SUPPLYPLANT_VH":
                    var oBindingParams = oEvent.getParameter("bindingParams");
                    var destID = this.getView().getModel("SalesOrder").getProperty("/stodestid");
                    var startFilter1 = new sap.ui.model.Filter("destid", "EQ", destID);
                    oBindingParams.filters.push(startFilter1);
                    break; */

                case "ZMM_CDS_B_MODEOFTRANSPORT_VH":
                    var oBindingParams = oEvent.getParameter("bindingParams");
                    var startFilter = new sap.ui.model.Filter("vktra", "EQ", '01');
                    var startFilter1 = new sap.ui.model.Filter("vktra", "EQ", '02');
                    oBindingParams.filters.push(startFilter);
                    oBindingParams.filters.push(startFilter1);
                    break;

                case "ZMM_CDS_B_RECEIVEPLANT_VH":
                    var destID = this.mStoData.getProperty("/stodestid");
                    var supplyPlant = this.mStoData.getProperty("/reswk");
                    var oBindingParams = oEvent.getParameter("bindingParams");
                    var startFilter1 = new sap.ui.model.Filter("destid", "EQ", destID);
                    oBindingParams.filters.push(startFilter1);
                    // var startFilter2 = new sap.ui.model.Filter("werks", "EQ", supplyPlant);        // - evkontos 16.4.2024
                    var startFilter2 = new sap.ui.model.Filter("SupplyingPlant", "EQ", supplyPlant);  // + evkontos 16.4.2024
                    oBindingParams.filters.push(startFilter2);
                    break;

                case "ZMM_CDS_B_MATERIAL_VH":
                    var supplyPlant = this.mStoData.getProperty("/reswk");
                    var oBindingParams = oEvent.getParameter("bindingParams");
                    //  var startFilter1 = new sap.ui.model.Filter("matnr", "EQ", matnr);
                    // oBindingParams.filters.push(startFilter1);         
                    var startFilter2 = new sap.ui.model.Filter("werks", "EQ", supplyPlant);
                    oBindingParams.filters.push(startFilter2);
                    break;

                case "ZMM_CDS_B_VALTYPE_VH":
                    var matnr = this.mStoData.getProperty(this.currentEditingPath + "/matnr");
                    var supplyPlant = this.mStoData.getProperty("/reswk");

                    var oBindingParams = oEvent.getParameter("bindingParams");

                    var startFilter1 = new sap.ui.model.Filter("matnr", "EQ", matnr);
                    oBindingParams.filters.push(startFilter1);

                    var startFilter2 = new sap.ui.model.Filter("bwkey", "EQ", supplyPlant);
                    oBindingParams.filters.push(startFilter2);
                    break;

                default:
                    break;
            }
        },

        /* - evkontos 24.4.2024: not used
        handleSuggestionContractItemSelect: function (oEvent) {
            var Tablepath = this.getView().getModel("SalesOrder").getData().to_OrdersChangeItems.results.length - 1;
            var sPath = oEvent.getParameters().selectedItem.oBindingContexts.S1.sPath.split("/")[2];

            var ContractOrderQuant = this.getOwnerComponent().getModel("S1").getData().results[sPath].ContractOrderQuantity;
            var ContractOrderQ = this.getOwnerComponent().getModel("S1").getData().results[0].TargetQuantityUnit;


            this.getView().getModel("SalesOrder").setProperty("/to_OrdersChangeItems/results/" + Tablepath + "/ContractOrderQuantity", ContractOrderQuant);
            this.getView().getModel("SalesOrder").setProperty("/to_OrdersChangeItems/results/" + Tablepath + "/ContractTargetQuantityUnit", ContractOrderQ);


            var openqty = this.getOwnerComponent().getModel("S1").getData().results[sPath].OpenContractQuantity;
            this.getView().getModel("SalesOrder").setProperty("/to_OrdersChangeItems/results/" + Tablepath + "/OpenContractQuantity", openqty);


            var ConsumedQty = this.getOwnerComponent().getModel("S1").getData().results[sPath].TargetQuantity;
            this.getView().getModel("SalesOrder").setProperty("/to_OrdersChangeItems/results/" + Tablepath + "/ContractTargetQuantity", ConsumedQty);


            this.contract_Matnr = this.getOwnerComponent().getModel("S1").getData().results[sPath].matnr;

            this.getView().getModel("SalesOrder").setProperty("/to_OrdersChangeItems/results/" + Tablepath + "/matnr", this.contract_Matnr);

            var salesContractItem = this.getOwnerComponent().getModel("S1").getData().results[sPath].SalesContractItem;
            this.getView().getModel("SalesOrder").setProperty("/to_OrdersChangeItems/results/" + Tablepath + "/SalesOrderItem", salesContractItem);
        }*/

        // + evkontos 25.4.2024
        _validateInputs: function () {
            var oData = this.mStoData.getData(),
                aItems = oData?.stoItems,
                bValid = aItems.length > 0;

            if ((!(oData.stodestid)) ||
                (!(oData.motid)) ||
                (!(oData.Incoterm)) ||
                (!(oData.zzvehicle)) ||
                (!(oData.zz_cardid))) {
                bValid = false;
            }

            if (bValid) {
                aItems.forEach(function (oItem) {
                    if (((!!(oItem.indicator)) && (oItem.indicator !== "D")) &&
                        (((!(oItem.matnr)) ||
                            (!(oItem.eindt)) ||
                            (!(oItem.oihantyp)) ||
                            (!(oItem.menge)) ||
                            (!(oItem.meins)) ||
                            (!(oItem.bwtar)) ||
                            (!(oItem.werks))))) {
                        bValid = false;
                    }
                });
            }

            return bValid;
        }

    });

});