sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "../model/formatter",
    'sap/m/MessageBox',
    'sap/m/MessagePopover',
    'sap/m/MessageItem',
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (BaseController, JSONModel, History, formatter, MessageBox, MessagePopover, MessageItem, Fragment, Filter, FilterOperator) {
    "use strict";

    return BaseController.extend("helpe.fastentrysol.controller.Object", {

        formatter: formatter,
        oMessagePopover: "",
        contract_SalesOrganization: "",
        contract_DistributionChannel: "",
        contract_OrganizationDivision: "",
        contract_Matnr: "",
        contract_bukrs: "",
        salesOrder: "",


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
            var oViewModel = new JSONModel({});
            this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
            this.setModel(oViewModel, "SalesOrder");

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

            var smartValueHelpModel = new JSONModel();
            this.getView().setModel(smartValueHelpModel, "smartValueHelpModel");

            this.getView().setModel(new JSONModel({
                "Title": "Truck/Train",
                "Text": "Create Sales Order",
                "Icon": "sap-icon://shipping-status",
                "Item": "Sales Order Item"
            }), "textModel");

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

            this.getView().setModel(new JSONModel([]), "compartmentData");
            this.getView().setModel(new JSONModel([]), "vehicleData");
            this.getView().setModel(new JSONModel({ hasContract: true }), "contractModel");
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

        onPressDeleteLine: function (oEvent) {
            var oSalesModel = this.getView().getModel("SalesOrder"),
                oDeletedContext = oEvent.getSource().getBindingContext("SalesOrder"),
                sDeletionPath = oDeletedContext.getPath();

            oSalesModel.setProperty(sDeletionPath + "/indicator", "D");
        },

        onPressCancel: function (oEvent) {
            var sPreviousHash = History.getInstance().getPreviousHash();

            if (sPreviousHash !== undefined) {
                history.go(-1);
            } else {
                this.getRouter().navTo("worklist", {}, true);
            }
        },

        onPressSave: function () {
            // var bHasContract = this.getView().getModel("contractModel").getProperty("/hasContract");

            if (this._validateInputs()) {
                if (this.salesOrder) {
                    this.editSo();
                } else {
                    //this.saveSo(); i338362 no Create scanrio in solvents should delete code
                }
            } else {
                MessageBox.error("Please fill in all mandatory fields.");
            }
        },

        // saveSo: function () {
        //     var oModel = this.getView().getModel("SalesOrder"),
        //         oModelData = oModel.getData(),
        //         bHasContract = this.getView().getModel("contractModel").getProperty("/hasContract"),
        //         aItems = [],
        //         that = this;

        //     for (var i = 0; i < oModelData.to_OrdersChangeItems.results.length; i++) {

        //         var oItem = oModelData.to_OrdersChangeItems.results[i];

        //         if ((!(oItem?.indicator)) || (oItem?.indicator) !== "D") {
        //             var oObj = {};

        //             if (bHasContract) {
        //                 oObj = {
        //                     "ContractNo": oModelData.SalesContract,
        //                     "ContractItem": oItem.SalesOrderItem,
        //                     "MaterialLong": oItem.matnr,
        //                     "Zzvehicle": oItem.zzvehicle,
        //                     "Zztrailer": oItem.zztrailer,
        //                     "TargetQty": (+oItem.TargetQuantity).toString(),
        //                     "TargetQu": "KG",
        //                     "Zzcomp": oItem.zzcomp,
        //                     "Zzcompcap": (+oItem.zzcompcap).toString(),
        //                     "Zzcompcapuom": oItem.zzcompcapuom,
        //                     "Zzvendor": oModelData.zzvendor,
        //                     "Zzdrivercode": oModelData.zzdrivercode,
        //                     "Zzdriverfname": oModelData.zzdriverfname,
        //                     "Zzdriverlname": oModelData.zzdriverlname,
        //                     "Zzdestid": oModelData.zzdestid,
        //                     "Incoterms1": oItem.inco1,
        //                     "OicMot": oModelData.mot,
        //                     "OihLicin": oItem.oih_licin,
        //                     "Oihantyp": oItem.oihantyp,
        //                     "Zzitbrand": oItem.zzitbrand,
        //                     "ZzcardidSo": oModelData.zzcardidso
        //                 };
        //             } else {
        //                 oObj = {
        //                     "ItmNumber": "",
        //                     "MaterialLong": oItem.matnr,
        //                     "Zzvehicle": oItem.zzvehicle,
        //                     "Zztrailer": oItem.zztrailer,
        //                     "TargetQty": (+oItem.TargetQuantity).toString(),
        //                     "TargetQu": "KG",
        //                     "Zzcomp": oItem.zzcomp,
        //                     "Zzcompcap": (+oItem.zzcompcap).toString(),
        //                     "Zzcompcapuom": oItem.zzcompcapuom,
        //                     "Zzvendor": oModelData.zzvendor,
        //                     "Zzimo": "",
        //                     "Zzdrivercode": oModelData.zzdrivercode,
        //                     "Zzdriverfname": oModelData.zzdriverfname,
        //                     "Zzdriverlname": oModelData.zzdriverlname,
        //                     "Zztankid": oModelData.zztankid,
        //                     "Zzmeterid": oModelData.zzmeterid,
        //                     "Zzdestid": oModelData.zzdestid,
        //                     "Zzloadid": oModelData.zzloadid,
        //                     "Zzitbrand": oItem.zzitbrand,
        //                     "Incoterms1": oItem.inco1,
        //                     "Incoterms2": "",
        //                     "OicMot": oModelData.mot,
        //                     "OihLicin": oItem.oih_licin,
        //                     "ZzcardidSo": oModelData.zzcardidso,
        //                     "Oihantyp": oItem.oihantyp
        //                 };
        //             }

        //             aItems.push(oObj);
        //         }
        //     }

        //     var oPayload = {};
        //     if (bHasContract) {
        //         oPayload = {
        //             "SalesOrg": oModelData.vkorg,
        //             "DistrChan": oModelData.vtweg,
        //             "Division": oModelData.spart,
        //             "DocType": oModelData.auart,
        //             "RefDoc": oModelData.SalesContract,
        //             "Zzmrnssdn": oModelData.zzmrnssdn,
        //             "Plant": oModelData.werks,
        //             "ReqDateH": this.formatter.UTCDate(oModelData.vdatu),
        //             "IntercompKunnr": oModelData.IntercompanyPartner,
        //             "ShipToKunnr": oModelData.ShipToParty,
        //             "BillTo": (!!(oModelData.BillToParty)) ? oModelData.BillToParty : oModelData.ShipToParty,
        //             "Bstnk": oModelData.getData().bstnk,
        //             "Vsart": oModelData.ShippingType,
        //             "Zzhandid": oModelData.zzhandid,
        //             "toSOMotTrucksItemCreate": aItems,
        //             "toSOMotTrucksCrReturn": []
        //         };
        //     } else {
        //         oPayload = {
        //             "SalesOrg": oModelData.vkorg,
        //             "DistrChan": oModelData.vtweg,
        //             "Division": oModelData.spart,
        //             "DocType": oModelData.auart,
        //             "Zzmrnssdn": oModelData.zzmrnssdn,
        //             "Zzseal": "",
        //             "Plant": oModelData.werks,
        //             "ReqDateH": this.formatter.UTCDate(oModelData.vdatu),
        //             "IntercompKunnr": oModelData.IntercompanyPartner,
        //             "ShipToKunnr": oModelData.ShipToParty,
        //             "BillTo": (!!(oModelData.BillToParty)) ? oModelData.BillToParty : oModelData.ShipToParty,
        //             "Bstnk": oModelData.bstnk,
        //             "Vsart": oModelData.ShippingType,
        //             "Zzhandid": oModelData.zzhandid,
        //             "toSODirectEntryItem": aItems,
        //             "toSODirectEntryReturn": [],
        //             "toSODirectEntrySingleReturn": []
        //         };
        //     }

        //     var sCreatePath = (bHasContract) ? "/SOMotTrucksCreateSet" : "/SODirectEntryCreateSet",
        //         sReturnPath = (bHasContract) ? "toSOMotTrucksCrReturn" : "toSODirectEntryReturn";

        //     this.getView().getModel().create(sCreatePath, oPayload, {
        //         success: function (oData) {
        //             that.byId("messagePopoverBtn").setVisible(true);
        //             sap.ui.core.BusyIndicator.hide();

        //             var msgs = [],
        //                 // n = oData.toSOMotTrucksCrReturn.results.length;
        //                 n = oData[sReturnPath].results.length;

        //             for (var i = 0; i < n; i++) {
        //                 /* if (oData.toSOMotTrucksCrReturn.results[i].Type === "S") {
        //                     oData.toSOMotTrucksCrReturn.results[i].Type = "Success"
        //                 } else if (oData.toSOMotTrucksCrReturn.results[i].Type === "W") {
        //                     oData.toSOMotTrucksCrReturn.results[i].Type = "Warning"
        //                 } else if (oData.toSOMotTrucksCrReturn.results[i].Type === "E") {
        //                     oData.toSOMotTrucksCrReturn.results[i].Type = "Error"
        //                 } */

        //                 if (oData[sReturnPath].results[i].Type === "S") {
        //                     oData[sReturnPath].results[i].Type = "Success"
        //                 } else if (oData[sReturnPath].results[i].Type === "W") {
        //                     oData[sReturnPath].results[i].Type = "Warning"
        //                 } else if (oData[sReturnPath].results[i].Type === "E") {
        //                     oData[sReturnPath].results[i].Type = "Error"
        //                 }

        //                 /* var Messages = {
        //                     type: oData.toSOMotTrucksCrReturn.results[i].Type,
        //                     title: oData.toSOMotTrucksCrReturn.results[i].Message,
        //                     description: oData.toSOMotTrucksCrReturn.results[i].Message,
        //                     counter: i + 1
        //                 }; */

        //                 var Messages = {
        //                     type: oData[sReturnPath].results[i].Type,
        //                     title: oData[sReturnPath].results[i].Message,
        //                     description: oData[sReturnPath].results[i].Message,
        //                     counter: i + 1
        //                 };

        //                 msgs.push(Messages);
        //             }

        //             var oModelmsg = new JSONModel();
        //             oModelmsg.setData(msgs);

        //             that.getView().setModel(oModelmsg, "oModelmsg");
        //             that.byId("messagePopoverBtn").addDependent(that.oMessagePopover);

        //             // n = oData.toSOMotTrucksCrReturn.results.length;
        //             n = oData[sReturnPath].results.length;

        //             /* for (i = 0; i < n; i++) {
        //                 if (oData.toSOMotTrucksCrReturn.results[i].Id === 'V1' && 
        //                     oData.toSOMotTrucksCrReturn.results[i].Number === '311') {
        //                     // MessageBox.success(oData.toSOMotTrucksCrReturn.results[i].Message);
        //                     // that.getView().getModel("SalesOrder").setData("");
        //                     MessageBox.success(oData.toSOMotTrucksCrReturn.results[i].Message, {
        //                         actions: [MessageBox.Action.OK],
        //                         emphasizedAction: MessageBox.Action.OK,
        //                         onClose: function () {
        //                             that.getRouter().navTo("worklist", {}, true);
        //                             // that.getView().getModel("SalesOrder").setData();
        //                         }
        //                     });
        //                 }
        //             } */

        //             for (i = 0; i < n; i++) {
        //                 if (oData[sReturnPath].results[i].Id === 'V1' &&
        //                     oData[sReturnPath].results[i].Number === '311') {
        //                     MessageBox.success(oData[sReturnPath].results[i].Message, {
        //                         actions: [MessageBox.Action.OK],
        //                         emphasizedAction: MessageBox.Action.OK,
        //                         onClose: function () {
        //                             that.getRouter().navTo("worklist", {}, true);
        //                         }
        //                     });
        //                 }
        //             }
        //         },
        //         error: function (oData, oError) {
        //             sap.ui.core.BusyIndicator.hide();
        //         }
        //     });

        // },

        editSo: function () {
            var oModel = this.getView().getModel("SalesOrder"),
                oModelData = oModel.getData(),
                aItems = [],
                that = this;

            for (var i = 0; i < oModelData.to_OrdersChangeItems.results.length; i++) {

                var oItem = oModelData.to_OrdersChangeItems.results[i],
                    bInclude = true;

                if ((oItem.indicator === "D") &&
                    ((oItem.SalesOrderItem === "000000") ||
                        (oItem.SalesOrderItem === ""))) {
                    bInclude = false;
                }

                var oObj = {
                    "Posnr": (oItem.indicator === "I") ? "000000" : oItem.SalesOrderItem,
                    "TargetQty": (+oItem.TargetQuantity).toString(),
                    "TargetQu": "KG",
                    "Incoterms1": oItem.inco1,
                    "OihLicin": oItem.oih_licin,
                    "Zzvehicle": oItem.zzvehicle,
                    "Zztrailer": oItem.zztrailer,
                    "Zzdrivercode": oModelData.zzdrivercode,
                    "Zzdriverfname": oModelData.zzdriverfname,
                    "Zzdriverlname": oModelData.zzdriverlname,
                    "Zzvendor": oModelData.zzvendor,
                    "ZzcardidSo": oModelData.zzcardidso,
                    "Updateflag": (!!(oItem.indicator)) ? oItem.indicator : "U",
                    "ContractNo": oModelData.SalesContract,
                    "ContractItem": oItem.SalesOrderItem,
                    "MaterialLong": oItem.matnr,
                    "Zzcomp": oItem.zzcomp,
                    "Zzcompcap": (+oItem.zzcompcap).toString(),
                    "Zzcompcapuom": oItem.zzcompcapuom,
                    "Zzdestid": oModelData.zzdestid,
                    "OicMot": oItem.oic_mot,
                    "Oihantyp": oItem.oihantyp,
                    "Zzitbrand": oItem.zzitbrand
                };

                if (bInclude) {
                    aItems.push(oObj);
                }
            }

            var oPayload = {
                "Vbeln": this.salesOrder,
                "ReqDateH": oModelData.vdatu,
                "Bstnk": oModelData.bstnk,
                "Updateflag": "U",
                "BillTo": oModelData.ShipToParty,
                "Zzseal": oModelData.zzseal,
                "Zzhandid": oModelData.zzhandid,
                "toSOChangeItem": aItems,
                "toSOChangeReturn": []
            };
            sap.ui.core.BusyIndicator.show();
            this.getView().getModel().create("/SalesOrderChangeSet", oPayload, {
                success: function (oData, oResponse) {
                    //refector to Basecontroller I338362
                    that.processMessages(oData.toSOChangeReturn.results, that);
                },
                error: function (oError) {
                    sap.ui.core.BusyIndicator.hide();
                }
            });
        },

        _getDate: function (date) {
            if (date !== null) {
                var dDate = new Date(date.getTime());
                var offset = dDate.getTimezoneOffset() / 60;
                var hours = dDate.getHours();
                dDate.setHours(hours - offset);
            }

            return dDate;
        },

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

        onCancelValueHelp: function (oEvent) {
            //i338362 change for navigation fix
            oEvent.getSource().getParent().close();
            // this._pValueHelpDialog.destroy;
            // this._pValueHelpDialog = null;
            // this._vValueHelpDialog = null;
            // this.getView().destroyDependents();
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

        /**
         * Binds the view to the object path.
         * @function
         * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
         * @private
         */
        _onObjectMatched: function (oEvent) {
            var oArgs = oEvent.getParameter("arguments"),
                sObjectId = oArgs.objectId,
                sMode = oArgs.mode;

            if ((sObjectId !== "new") && (sMode !== "create") && (sMode !== "createWC")) {
                this._fillSalesOrderModel(sObjectId);
            } else {
                // error
            }

            var S1 = this.getOwnerComponent().getModel("S1");
            this.getView().setModel(S1, "S1");

            this.getView().byId("messagePopoverBtn").setVisible(false);

            var editableModel = this.getOwnerComponent().getModel("editableModel");
            this.getView().setModel(editableModel, "editableModel");

            //reset after QP
            this.bOgLineTaken = false;
            this.byId("undoQPbutton").setVisible(false);
            this.byId("inputVehicleId").setEnabled(true);
            this.byId("inputTrailerID").setEnabled(true);
            this.byId("QPbutton").setEnabled(false);

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
                    this.getView().getModel("contractModel").setProperty("/hasContract", true);
                    break;

                case "createWC":
                    var oModel = new JSONModel({
                        vstel: "",
                        zzdestid: "",
                        kunnr: "",
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
                    this.getView().getModel("textModel").setProperty("/Text", "Create Sales Order without Contract");
                    if (Object.keys(editableModel.getData()).length === 0) {
                        this._setEditableModel(true, true);
                    }
                    this.getView().getModel("contractModel").setProperty("/hasContract", false);
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

            this.getView().getModel("vehicleData")?.setData([]);
            this.getView().getModel("compartmentData")?.setData([]);
        },

        _fillSalesOrderModel: function (sSalesOrder) {
            var oModel = this.getOwnerComponent().getModel(),
                SOModel = this.getOwnerComponent().getModel("SOModel"),
                that = this;

            if (!!(SOModel.getProperty("/SalesOrder"))) {

                if (!!(SOModel.getProperty("/ContractValidityEndDate"))) {
                    var validTillDate = SOModel.getProperty("/ContractValidityEndDate").toDateString();
                    SOModel.setProperty("/ContractValidityEndDate", validTillDate);
                }

                this.getView().setModel(SOModel, "SalesOrder");
                this.salesOrder = SOModel.getProperty("/SalesOrder");

                if (!!(SOModel.getProperty("/SalesContract"))) {
                    this._fillSalesContractMaterialsModel(SOModel.getProperty("/SalesContract"));
                    this.getView().getModel("contractModel").setProperty("/hasContract", true);
                } else {
                    this.getView().getModel("contractModel").setProperty("/hasContract", false);
                }
            } else {
                oModel.read("/ZSD_CDS_B_ORDERS(SalesOrder='" + sSalesOrder + "')", {
                    urlParameters: {
                        "$expand": "to_OrdersChangeItems"
                    },
                    success: function (oData, oResponse) {
                        if (oData !== undefined) {

                            var SOModel = new JSONModel(oData);
                            that.getView().setModel(SOModel, "SalesOrder");
                            that.salesOrder = sSalesOrder;

                            if (!!(SOModel.getProperty("/ContractValidityEndDate"))) {
                                var validTillDate = SOModel.getProperty("/ContractValidityEndDate").toDateString();
                                SOModel.setProperty("/ContractValidityEndDate", validTillDate);
                            }

                            // that._fillSalesContractMaterialsModel(SOModel.getProperty("/SalesContract"));

                            if (!!(SOModel.getProperty("/SalesContract"))) {
                                that._fillSalesContractMaterialsModel(SOModel.getProperty("/SalesContract"));
                                this.getView().getModel("contractModel").setProperty("/hasContract", true);
                            } else {
                                that.getView().getModel("contractModel").setProperty("/hasContract", false);
                            }

                        }
                    }.bind(this),
                    error: function (oError) {
                        console.log(JSON.stringify(oError));
                    }
                });
            }

        },

        _setEditableModel: function (TorF, onlyDisplay) {
            var editVals = {
                //Header Fields
                "onlyDisplay": onlyDisplay,
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
                "AddBtn": TorF,

            };

            this.getView().getModel("editableModel").setData(editVals);
        },

        handleMessagePopoverPress: function (oEvent) {
            this.oMessagePopover.toggle(oEvent.getSource());
        },

        buttonIconFormatter: function () {
            return "sap-icon://information";
        },

        buttonTypeFormatter: function () {
            return "Neutral";
        },

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
        },

        onValueHelpRequest: function (oEvent) {

            var entitySet = oEvent.getSource().getCustomData()[0].getValue("entitySet"),
                soModel = this.getView().getModel("SalesOrder");

            this.currentEditingPath = oEvent.getSource().getBindingContext("SalesOrder")?.getPath();    // + evkontos 26.4.2024

            if (oEvent.getSource().getParent().sId.includes("soItemTable")) {
                // this.currentEditingPath = oEvent.getSource().getParent().getIndex();
                var path = oEvent.getSource().getBindingContext("SalesOrder").getPath();
                this.soItem = soModel.getProperty(path).SalesOrderItem;
            }

            var InitiallyVisibleFields;
            var searchHelpText;
            var oView = this.getView();
            //I338362 all for clear button
            if (this.bClearButtonPressed) {
                this.bClearButtonPressed = false;
                return;
            }

            switch (entitySet) {
                case "ZSD_CDS_B_CONTRACT_VH":
                    InitiallyVisibleFields = "SalesContract,SalesOrganization,DistributionChannel,OrganizationDivision,SalesContractValidityEndDate,SoldToParty,SoldToPartyName,SoldToPartyLand,ShipToParty,ShipToPartyName,ShipToPartyLand,bukrs_vf,bstnk";
                    searchHelpText = "Sales Contract";
                    break;

                case "ZSD_CDS_B_ShipTo_VH":
                    InitiallyVisibleFields = "ShipToParty,ShipToPartyName,ShipToPartyLand";
                    searchHelpText = "ShipTo Party";
                    break;

                case "ZSD_CDS_B_TL_DEST":
                    InitiallyVisibleFields = "Destid,Desttext,Vstel,Werks,WerksName,IsLand";
                    searchHelpText = "Destination";
                    break;

                case "ZSD_CDS_B_FAST_ENTRY_ITEMS":
                    InitiallyVisibleFields = "SalesContractItem,SalesContract,TargetQuantity,ContractOrderQuantity,OpenContractQuantity,matnr"
                    searchHelpText = "Contract Items";
                    break;

                case "I_UnitOfMeasure":
                    InitiallyVisibleFields = "UnitOfMeasure,UnitOfMeasure_Text"
                    searchHelpText = "Unit Of Measure";
                    break;

                case "ZSD_CDS_B_TL_DEST2":
                    InitiallyVisibleFields = "Vstel,Destid,Werks,WerksName,Desttext,IsLand,Vkorg,VkorgDesc,Vtweg,VtwegDesc,Spart,SpartDesc,Auart,AuartDesc"
                    searchHelpText = "Loading Point";
                    break;

                case "ZSD_CDS_B_ShippingType_VH":
                    InitiallyVisibleFields = "ShippingType,ShippingTypeDesc,ModeOfTransport,ModeOfTransportDesc"
                    searchHelpText = "Mode Of Transport";
                    break;

                case "ZSD_CDS_B_CARRIER_VH":
                    InitiallyVisibleFields = "Supplier,SupplierName,CountryCode,CompanyCode,PurchaseOrganization"
                    searchHelpText = "Suppliers";
                    break;

                case "ZSD_CDS_B_HANDID_VH":
                    InitiallyVisibleFields = "HandID,HandIDDesc"
                    searchHelpText = "Handling ID";
                    break;

                case "C_MM_IncotermValueHelp":
                    InitiallyVisibleFields = "IncotermsClassification,IncotermsClassificationName"
                    searchHelpText = "Incoterm";
                    break;

                case "ZSD_CDS_B_LICENSE_VH":
                    InitiallyVisibleFields = "licin,lctxt,lictp,matnr,SoldToParty"
                    this.selectedrow = oEvent.getSource().getBindingContext("SalesOrder").sPath.split("/")[3];
                    searchHelpText = "License ID";
                    break;

                case "ZSD_CDS_B_HANDLINGTYPE_VH":
                    InitiallyVisibleFields = "HandlingType,HandlingTypeDesc,HandID"
                    searchHelpText = "Handling Type";
                    break;

                case "ZSD_CDS_B_IntPartner_VH":
                    InitiallyVisibleFields = "IntercompanyPartner,IntercompanyPartnerName,land1"
                    searchHelpText = "Intercompany Partner";
                    break;

                case "DriverVHSet":
                    InitiallyVisibleFields = "Driverid,Firstname,Lastname,Islocked"
                    searchHelpText = "Driver ID"
                    break;

                case "ZMM_CDS_B_MATERIAL_VH":
                    InitiallyVisibleFields = "matnr,werks,maktx,name1,mtart,mtbez,matkl,wgbez,bismt";
                    searchHelpText = "Material";
                    break;

                case "ZSD_CDS_B_CustomerSalesArea":
                    InitiallyVisibleFields = "Customer,CustomerName,Country,SalesOrganization,SalesOrganizationName,DistributionChannel,DistributionChannelName,SalesGroup,SalesGroupName,Division,DivisionName";
                    searchHelpText = "Customer";
                    break;

                case "I_SalesDocumentItemBasic":
                    InitiallyVisibleFields = "Material,Material_Text,OrderQuantity,OrderQuantityUnit";
                    searchHelpText = "Material";
                    break;

                default:
                    break
            }

            this.getView().getModel("smartValueHelpModel").setProperty("/EntitySet", entitySet);
            this.getView().getModel("smartValueHelpModel").setProperty("/InitiallyVisibleFields", InitiallyVisibleFields);
            this.getOwnerComponent().getModel("searchHelpTextModel").setProperty("/searchHelpText", searchHelpText);

            var oView = this.getView();
            if (!this._pValueHelpDialog) {
                this._pValueHelpDialog = Fragment.load({
                    id: oView.getId(),
                    name: "helpe.fastentrysol.fragment.smart",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }
            this._pValueHelpDialog.then(function (oDialog) {
                oDialog.open();
            });
        },

        onVehicleValueHelpRequest: function (oEvent) {
            var oView = this.getView(),
                sVehicleType = oEvent.getSource().data("vehicleType"),
                that = this;

            if (!this._vValueHelpDialog) {
                this._vValueHelpDialog = Fragment.load({
                    id: oView.getId(),
                    name: "helpe.fastentrysol.fragment.VehicleValueHelpDialog",
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
            var aFilters = [];
            var oView = this.getView();
            var oModel = this.getOwnerComponent().getModel();
            var sPath = "/VehicleVHSet";

            this.getView().getModel("vehicleData")?.setData([]);
            aFilters.push(new Filter("Vehicletype", FilterOperator.EQ, sVehicleType));

            oModel.read(sPath, {
                filters: aFilters,
                urlParameters: {
                    "$expand": "toVehicleVHCopartment"
                },
                success: function (oData, oResponse) {
                    oView.getModel("vehicleData").setData(oData?.results);
                    oDialog.setBusy(false);
                },
                error: function (oError) {
                    console.log("error");
                    oDialog.setBusy(false);
                }
            });
        },

        onVehicleSearch: function (oEvent) {
            var sValue = oEvent.getParameter("value"),
                oFilter = new Filter("Vehicleno", FilterOperator.Contains, sValue),
                oBinding = oEvent.getParameter("itemsBinding");
            oBinding.filter([oFilter]);
        },

        onVehicleCancel: function (oEvent) {
            oEvent.getSource().getBinding("items").filter(null);
        },

        addNewLines: function (aItems, sType) {
            var oData = this.getView().getModel("SalesOrder").getData(),
                oSalesModel = this.getView().getModel("SalesOrder");

            aItems.forEach(function (oItem) {

                oData.to_OrdersChangeItems.results.push({
                    "SalesOrderItem": "",
                    "matnr": oSalesModel.getProperty("/to_OrdersChangeItems/results/0/matnr"),
                    "TargetQuantity": "",
                    "TargetQuantityUnit": "KG",
                    "zzcomp": oItem.Compartmentno,
                    "zzcompcap": oItem.Volume,
                    "zzcompcapuom": oItem.Uom,
                    "oihantyp": oSalesModel.getProperty("/to_OrdersChangeItems/results/0/oihantyp"),
                    "oih_licin": oSalesModel.getProperty("/to_OrdersChangeItems/results/0/oih_licin"),
                    "oic_mot": oSalesModel.getProperty("/to_OrdersChangeItems/results/0/oic_mot"),
                    "oic_motDesc": oSalesModel.getProperty("/to_OrdersChangeItems/results/0/oic_motDesc"),
                    "inco1": oSalesModel.getProperty("/to_OrdersChangeItems/results/0/inco1"),
                    "indicator": "I",

                    "zzvehicle": oSalesModel.getProperty("/zzvehicle"),
                    "zztrailer": sType !== "truck" ? oSalesModel.getProperty("/zztrailer") : ""

                });
            });

            var soItems = oData.to_OrdersChangeItems.results;
            this.contract_Matnr = oSalesModel.getProperty("/to_OrdersChangeItems/results/0/matnr");
            oSalesModel.refresh();

        },

        onVehicleConfirm: function (oEvent) {
            var oContext = oEvent.getParameter("selectedItem").getBindingContext("vehicleData"),
                sVehicleno = oContext.getProperty("Vehicleno"),
                sVehicletype = oContext.getProperty("Vehicletype"),
                aCompartments = oContext.getProperty("toVehicleVHCopartment").results,
                bLocked = oContext.getProperty("Islocked"),
                oI18n = this.getView().getModel("i18n")?.getResourceBundle(),
                oSalesModel = this.getView().getModel("SalesOrder"),
                sProperty = sVehicletype === "truck" ? "zzvehicle" : "zztrailer";

            if (bLocked) {
                MessageBox.information(oI18n.getText("lockedVehicleError", [sVehicletype]));
            } else {
                if (oSalesModel.getProperty("/" + sProperty) !== sVehicleno) {
                    oSalesModel.setProperty("/" + sProperty, sVehicleno);
                    this.getView().getModel("compartmentData").setData(aCompartments);

                    //I338362 check if button is avaliable and trailer and truck selected then enabled qp button
                    if (oSalesModel.getProperty("/zzvehicle")
                        && oSalesModel.getProperty("/zztrailer")
                        && this.byId("QPbutton").getVisible()) {
                        this.byId("QPbutton").setEnabled(true);
                        //grab orginal line for keeping track of oringal quantity
                        if (!this.bOgLineTaken) {
                            this.ogLine = oSalesModel.getProperty("/to_OrdersChangeItems/results")[0];
                            this.bOgLineTaken = true;
                        }

                    }

                    this.deleteOldLines(sVehicleno, sVehicletype);
                    this.addNewLines(aCompartments, sVehicletype);
                    // this.convertQuan(oSalesModel);

                    //I338362 check if button is avaliable and trailer and truck selected then enabled qp button
                    if (oSalesModel.getProperty("/zzvehicle")
                        && oSalesModel.getProperty("/zztrailer")
                        && this.byId("QPbutton").getVisible()) {
                        this.byId("QPbutton").setEnabled(true);
                    }
                }
            }

            oEvent.getSource().getBinding("items").filter(null);
        },

        deleteOldLines: function (sVehicleno, sType) {
            var oSalesModel = this.getView().getModel("SalesOrder"),
                sPath = "/to_OrdersChangeItems/results",
                aItems = oSalesModel.getProperty(sPath);

            aItems?.forEach(function (oItem) {
                if (sType === "truck") {
                    /* - evkontos 10.5.2024
                    if ((oItem.zzvehicle !== sVehicleno) && (oItem.zztrailer === "")) {
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
                        oItem.indicator = "D";
                    }
                }
            });

            if ((aItems) && (aItems.length > 0)) {
                oSalesModel.setProperty(sPath, aItems);
                oSalesModel.refresh();
            }
        },

        onSelectValueHelp: function (oEvent) {
            var selectedValue = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[0].mProperties.text;
            var entitySet = this.getView().getModel("smartValueHelpModel").getProperty("/EntitySet"),
                oSelectedItem = this.getView().byId('idPOSchedulePage_table0').getSelectedItem(),
                oSelectedContext = oSelectedItem.getBindingContext(),
                oSalesModel = this.getView().getModel("SalesOrder");

            switch (entitySet) {
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
                    this.contract_SalesOrganization = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[1].mProperties.text;
                    this.contract_DistributionChannel = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[2].mProperties.text;
                    this.contract_OrganizationDivision = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[3].mProperties.text;
                    this.contract_bukrs = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[11].mProperties.text;

                    var custRef = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[12].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/bstnk", custRef);

                    //For Matnr and contract item Search Help
                    this._fillSalesContractMaterialsModel(selectedValue);
                    break;

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
                    break;

                case "I_UnitOfMeasure":
                    oSalesModel.setProperty("/UnitOfMeasure", selectedValue);
                    break;

                //DestId
                case "ZSD_CDS_B_TL_DEST":
                    oSalesModel.setProperty("/zzdestid", selectedValue);
                    break;

                //LP
                case "ZSD_CDS_B_ShipTo_VH":
                    this.getView().getModel("SalesOrder").setProperty("/ShipToParty", selectedValue);

                    var shipToPartyName = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[1].mProperties.text;
                    var shipToPartyLand = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[2].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/ShipToPartyName", shipToPartyName + ", " + shipToPartyLand);
                    break;

                case "ZSD_CDS_B_BILLTO_VH":
                    this.getView().getModel("SalesOrder").setProperty("/BillToParty", selectedValue);
                    var billToPartyName = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[1].mProperties.text;
                    var billToPartyLand = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[2].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/BillToPartyName", billToPartyName + ", " + billToPartyLand);
                    break;

                case "ZSD_CDS_B_LICENSE_VH":
                    oSalesModel.setProperty(this.currentEditingPath + "/oih_licin", selectedValue);
                    break;

                case "ZSD_CDS_B_HANDLINGTYPE_VH":
                    oSalesModel.setProperty(this.currentEditingPath + "/oihantyp", selectedValue);
                    break;

                //LP
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
                    break;

                //DestId
                case "ZSD_CDS_B_ShippingType_VH":
                    var shipTypeSelected = selectedValue;
                    this.getView().getModel("SalesOrder").setProperty("/ShippingType", shipTypeSelected);
                    var shippingTypeDesc = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[1].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/ShippingTypeDesc", shippingTypeDesc);
                    var mot = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[2].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/mot", mot);
                    var motDesc = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[3].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/motDesc", motDesc);

                    var Items = this.getView().getModel("SalesOrder").getData().to_OrdersChangeItems.results;
                    var itemLength = Items.length;
                    if (itemLength > 0) {
                        var init, len;
                        for (init = 0; init < itemLength; init++) {
                            this.getView().getModel("SalesOrder").setProperty("/to_OrdersChangeItems/results/" + init + "/oic_mot", mot);
                            this.getView().getModel("SalesOrder").setProperty("/to_OrdersChangeItems/results/" + init + "/oic_motDesc", motDesc);
                        }
                    }
                    break;

                case "ZSD_CDS_B_CARRIER_VH":
                    this.getView().getModel("SalesOrder").setProperty("/zzvendor", selectedValue);
                    var Supp_Name = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[1].mProperties.text;
                    var Supp_Land = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[2].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/zzvendorLand", Supp_Land);
                    this.getView().getModel("SalesOrder").setProperty("/zzvendorName", Supp_Name);
                    break;

                case "C_MM_IncotermValueHelp":
                    oSalesModel.setProperty(this.currentEditingPath + "/inco1", selectedValue);
                    break;

                case "ZSD_CDS_B_HANDID_VH":
                    this.getView().getModel("SalesOrder").setProperty("/zzhandid", selectedValue);
                    var HandIdDesc = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[1].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/zzhandid_desc", HandIdDesc);
                    break;

                case "ZSD_CDS_B_IntPartner_VH":
                    this.getView().getModel("SalesOrder").setProperty("/IntercompanyPartner", selectedValue);
                    var IntercompanyPartnerLand = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[2].mProperties.text;
                    var IntercompanyPartnerName = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[1].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/IntercompanyPartnerName", IntercompanyPartnerName + ", " + IntercompanyPartnerLand);
                    break;

                case "DriverVHSet":
                    this.getView().getModel("SalesOrder").setProperty("/zzdrivercode", selectedValue);
                    var driverFname = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[1].mProperties.text;
                    var driverLname = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[2].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/zzdriverfname", driverFname);
                    this.getView().getModel("SalesOrder").setProperty("/zzdriverlname", driverLname);
                    break;

                case "ZMM_CDS_B_MATERIAL_VH":
                    oSalesModel.setProperty(this.currentEditingPath + "/matnr", selectedValue);
                    this.contract_Matnr = selectedValue;
                    var fQty = oSalesModel.getProperty(this.currentEditingPath + "/TargetQuantity"),
                        sUom = oSalesModel.getProperty(this.currentEditingPath + "/TargetQuantityUnit"),
                        sCompUom = oSalesModel.getProperty(this.currentEditingPath + "/zzcompcapuom"),
                        oTable = this.getView().getContent()[0].getContent().getItems()[1],
                        that = this;

                    if ((!!(this.contract_Matnr)) && (!!(fQty)) && (!!(sUom)) && (sUom !== sCompUom)) {
                        oTable.setBusy(true);
                        this._convertUom(this.contract_Matnr, fQty, sUom, sCompUom).then(function (fConvQty) {
                            oSalesModel.setProperty(that.currentEditingPath + "/TargetQuantityConv", fConvQty);
                            oTable.setBusy(false);
                        },
                            function (error) {
                                MessageBox.error(error);
                                oTable.setBusy(false);
                            }.bind(that));
                    } else {
                        oSalesModel.setProperty(this.currentEditingPath + "/TargetQuantityConv", "");
                    }
                    break;

                case "ZSD_CDS_B_CustomerSalesArea":
                    oSalesModel.setProperty(this.currentEditingPath + "/kunnr", selectedValue);
                    oSalesModel.setProperty(this.currentEditingPath + "/name1", oSelectedContext.getProperty("CustomerName"));
                    oSalesModel.setProperty(this.currentEditingPath + "/land1", oSelectedContext.getProperty("Country"));
                    break;

                case "I_SalesDocumentItemBasic":
                    oSalesModel.setProperty(this.currentEditingPath + "/matnr", selectedValue);
                    this.contract_Matnr = selectedValue;
                    break;

                default:
                    break;
            }

            oEvent.getSource().getParent().close();

            //To Destroy the dependants on View 
            //commenting out since done in onSelectDialogAfterClose anyway
            // this._pValueHelpDialog.destroy;
            // this._pValueHelpDialog = null;
            // this._vValueHelpDialog = null;
            // this.getView().destroyDependents();
        },

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

        beforeGo: function (oEvent) {
            var entitySet, oBindingParams, startFilter;
            entitySet = this.getView().getModel("smartValueHelpModel").getProperty("/EntitySet");
            var loadingPt = this.getView().getModel("SalesOrder").getProperty("/vstel");

            switch (entitySet) {
                case "ZSD_CDS_B_FAST_ENTRY_ITEMS":
                    var salesContract = this.getView().getModel("SalesOrder").getProperty("/SalesContract");
                    var oBindingParams = oEvent.getParameter("bindingParams");
                    var startFilter = new sap.ui.model.Filter("SalesContract", "EQ", salesContract);
                    oBindingParams.filters.push(startFilter);
                    break;

                case "ZSD_CDS_B_ShippingType_VH":
                    var oBindingParams = oEvent.getParameter("bindingParams");
                    var startFilter = new sap.ui.model.Filter("ModeOfTransport", "EQ", '01');
                    var startFilter1 = new sap.ui.model.Filter("ModeOfTransport", "EQ", '02');
                    oBindingParams.filters.push(startFilter);
                    oBindingParams.filters.push(startFilter1);
                    break;

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
                    break;

                case "ZSD_CDS_B_TL_DEST":
                    var oBindingParams = oEvent.getParameter("bindingParams");
                    var startFilter5;
                    if (loadingPt !== "") {
                        startFilter5 = new sap.ui.model.Filter("Vstel", "EQ", loadingPt);
                    }

                    var startFilter1 = new sap.ui.model.Filter("Vkorg", "EQ", this.getView().getModel("SalesOrder").getProperty("/vkorg"));
                    var startFilter2 = new sap.ui.model.Filter("Vtweg", "EQ", this.getView().getModel("SalesOrder").getProperty("/vtweg"));
                    var startFilter3 = new sap.ui.model.Filter("Spart", "EQ", this.getView().getModel("SalesOrder").getProperty("/spart"));
                    var startFilter4 = new sap.ui.model.Filter("Auart", "EQ", this.getView().getModel("SalesOrder").getProperty("/auart"));
                    oBindingParams.filters.push(startFilter1);
                    oBindingParams.filters.push(startFilter2);
                    oBindingParams.filters.push(startFilter3);
                    oBindingParams.filters.push(startFilter4);
                    if (loadingPt !== "") {
                        oBindingParams.filters.push(startFilter5);
                    }
                    break;

                case "ZSD_CDS_B_TL_DEST2":
                    var dest = this.getView().getModel("SalesOrder").getProperty("/zzdestid");
                    var oBindingParams = oEvent.getParameter("bindingParams");
                    var startFilter = new sap.ui.model.Filter("Destid", "EQ", dest);
                    oBindingParams.filters.push(startFilter);
                    break;

                case "ZSD_CDS_B_LICENSE_VH":
                    this.onLicenseVHFilter(oEvent, this);
                    // var oBindingParams = oEvent.getParameter("bindingParams");
                    // var startFilter2 = new sap.ui.model.Filter("matnr", "EQ", this.contract_Matnr);
                    // oBindingParams.filters.push(startFilter2);

                    // if (!(this.contract_bukrs)) {
                    //     this.contract_bukrs = "G001";
                    // }
                    // var startFilter3 = new sap.ui.model.Filter("bukrs_vf", "EQ", this.contract_bukrs);
                    // oBindingParams.filters.push(startFilter3);
                    // var shipTo = this.getView().getModel("SalesOrder").getProperty("/ShipToParty");
                    // var startFilter4 = new sap.ui.model.Filter("ShipToParty", "EQ", shipTo);
                    // oBindingParams.filters.push(startFilter4);
                    // this.onLicenseVHFilter(oEvent, this);
                    break;

                case "ZSD_CDS_B_HANDLINGTYPE_VH":
                    var oBindingParams = oEvent.getParameter("bindingParams");
                    var HandleId = this.getView().getModel("SalesOrder").getProperty("/zzhandid");
                    var startFilter1 = new sap.ui.model.Filter("HandID", "EQ", HandleId);
                    oBindingParams.filters.push(startFilter1);
                    break;

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
                    break;

                case "I_SalesDocumentItemBasic":

                    var oBindingParams = oEvent.getParameter("bindingParams");
                    var SalesDoc = this.getView().getModel("SalesOrder").getProperty("/SalesOrder");

                    this.getView().getModel("SalesOrder").getProperty("/SalesOrder");
                    var startFilter1 = new sap.ui.model.Filter("SalesDocument", "EQ", SalesDoc);
                    oBindingParams.filters.push(startFilter1);

                    if (!!(this.soItem)) {  // + evkontos 25.4.2024
                        var startFilter2 = new sap.ui.model.Filter("SalesDocumentItem", "EQ", this.soItem);
                        oBindingParams.filters.push(startFilter2);
                    } // + evkontos 25.4.2024
                    break;

                default:
                    break;
            }
        },

        onMaterialQtyUoMChange: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext("SalesOrder"),
                sContextPath = oContext.getPath(),
                oSalesModel = this.getView().getModel("SalesOrder"),
                sMaterial = oContext.getProperty("matnr"),
                fQty = oContext.getProperty("TargetQuantity"),
                sUom = oContext.getProperty("TargetQuantityUnit"),
                sCompUom = oContext.getProperty("zzcompcapuom"),
                oTable = this.getView().getContent()[0].getContent().getItems()[1],
                that = this;

            if ((!!(sMaterial)) && (!!(fQty)) && (!!(sUom)) && (sUom !== sCompUom)) {
                oTable.setBusy(true);
                this._convertUom(sMaterial, fQty, sUom, sCompUom).then(function (fConvQty) {
                    oSalesModel.setProperty(sContextPath + "/TargetQuantityConv", fConvQty);
                    oTable.setBusy(false);
                },
                    function (error) {
                        MessageBox.error(error);
                        oTable.setBusy(false);
                    }.bind(that));
            } else {
                oSalesModel.setProperty(sContextPath + "/TargetQuantityConv", "");
            }
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

        //I338362 Convert for QP
        _convertUomQP: function (sMaterial, fQty, sUomFrom, sUomTo, sRow) {
            var oParams = {
                InMeins: sUomFrom,
                Matnr: sMaterial,
                Menge: fQty,
                OutMeins: sUomTo,
                sRow: sRow
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
                            var areturnarray = [+oData?.ConvertMaterialUnit?.TargetQuantity, oParams.sRow]
                            resolve(areturnarray);
                        }
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                });
            });
        },

        handleSuggestionContractItemSelect: function (oEvent) {
            var sInputPath = oEvent.getSource().getBindingContext("SalesOrder").getPath(),
                oSelectedContext = oEvent.getParameter("selectedRow").getBindingContext("S1"),
                oSelectedObject = oSelectedContext.getObject(),
                oSalesModel = this.getView().getModel("SalesOrder");

            oSalesModel.setProperty(sInputPath + "/ContractOrderQuantity", oSelectedObject.ContractOrderQuantity);
            oSalesModel.setProperty(sInputPath + "/ContractTargetQuantityUnit", oSelectedObject.TargetQuantityUnit);
            oSalesModel.setProperty(sInputPath + "/OpenContractQuantity", oSelectedObject.OpenContractQuantity);
            oSalesModel.setProperty(sInputPath + "/ContractTargetQuantity", oSelectedObject.TargetQuantity);
            oSalesModel.setProperty(sInputPath + "/matnr", oSelectedObject.matnr);
            oSalesModel.setProperty(sInputPath + "/SalesOrderItem", oSelectedObject.SalesContractItem);

            this.contract_Matnr = oSelectedObject.matnr;

            var fQty = oSalesModel.getProperty(sInputPath + "/TargetQuantity"),
                sUom = oSalesModel.getProperty(sInputPath + "/TargetQuantityUnit"),
                sCompUom = oSalesModel.getProperty(sInputPath + "/zzcompcapuom"),
                oTable = this.getView().getContent()[0].getContent().getItems()[1],
                that = this;

            if ((!!(this.contract_Matnr)) && (!!(fQty)) && (!!(sUom)) && (sUom !== sCompUom)) {
                oTable.setBusy(true);
                this._convertUom(this.contract_Matnr, fQty, sUom, sCompUom).then(function (fConvQty) {
                    oSalesModel.setProperty(sInputPath + "/TargetQuantityConv", fConvQty);
                    oTable.setBusy(false);
                },
                    function (error) {
                        MessageBox.error(error);
                        oTable.setBusy(false);
                    }.bind(that));
            } else {
                oSalesModel.setProperty(sInputPath + "/TargetQuantityConv", "");
            }
        },

        _fillSalesContractMaterialsModel: function (sContractNo) {
            var objModel = this.getOwnerComponent().getModel(),
                that = this;

            objModel.read("/ZSD_CDS_B_FAST_ENTRY_ITEMS", {
                filters: [
                    new sap.ui.model.Filter({
                        path: "SalesContract",
                        operator: sap.ui.model.FilterOperator.EQ,
                        value1: sContractNo
                    })],
                success: function (oData, oResponse) {
                    if (oData !== undefined) {
                        var S1 = that.getOwnerComponent().getModel("S1");
                        S1.setData(oData);
                        that.getView().setModel(S1, "S1");
                    }
                },
                error: function (oError) {
                    console.log(JSON.stringify(oError));
                }
            });

            if (!(this.contract_bukrs)) {
                objModel.read("/ZSD_CDS_B_CONTRACT_VH", {
                    filters: [
                        new sap.ui.model.Filter({
                            path: "SalesContract",
                            operator: sap.ui.model.FilterOperator.EQ,
                            value1: sContractNo
                        })],
                    success: function (oData, oResponse) {
                        that.contract_bukrs = oData?.results[0].bukrs_vf;
                        that.contract_SalesOrganization = oData?.results[0].SalesOrganization;
                        that.contract_DistributionChannel = oData?.results[0].DistributionChannel;
                        that.contract_OrganizationDivision = oData?.results[0].OrganizationDivision;
                    },
                    error: function (oError) {
                        console.log(JSON.stringify(oError));
                    }
                });
            }
        },

        _validateInputs: function () {
            var oSalesModel = this.getView().getModel("SalesOrder"),
                oData = oSalesModel.getData(),
                aItems = oData?.to_OrdersChangeItems?.results,
                bValid = true;

            if ((!(oData.zzdestid)) ||
                (!(oData.zzseal)) ||
                (!(oData.vstel)) ||
                (!(oData.zzhandid)) ||
                (!(oData.zzvendor)) ||
                (!(oData.vdatu)) ||
                (!(oData.zzdrivercode)) ||
                (!(oData.zzvehicle)) ||
                (!(oData.zztrailer)) ||
                (!(oData.zzcardidso))) {
                bValid = false;
            }

            if (bValid) {
                aItems.forEach(function (oItem) {
                    if (((!!(oItem.indicator)) && (oItem.indicator !== "D")) &&
                        (((!(oItem.matnr)) ||
                            (!(oItem.TargetQuantity)) ||
                            (!(oItem.TargetQuantityUnit)) ||
                            (!(oItem.oihantyp)) ||
                            (!(oItem.inco1))))) {
                        bValid = false;
                    }
                });
            }

            return bValid;
        },

        //I338362 for Quantity proposal
        onPressQP: function () {
            var SOModel = this.getModel("SalesOrder");
            var aItems = SOModel.getProperty("/to_OrdersChangeItems/results");
            var aPromises = [];
            var oTable = this.byId("soItemTable");
            //keeps track of the compartment mac capacity in kg to be used later in fill compartments
            this.aCompCaps = [];
            var aPromise = [];

            oTable.setBusy(true);
            //get the capacity of each compartment in liters
            for (var i = 0; i <= aItems.length - 1; i++) {
                var oitem = aItems[i],
                    //unique index for each row
                    sContextPath = oitem.zzvehicle + "-" + oitem.zztrailer + "-" + oitem.zzcomp,
                    oSalesModel = this.getView().getModel("SalesOrder"),
                    sIndicator = oitem.indicator,
                    sMaterial = oitem.matnr,
                    compcap = oitem.zzcompcap,
                    scompcapUom = oitem.zzcompcapuom,
                    sTargetQuantityUnit = oitem.TargetQuantityUnit,

                    that = this;
                this.sitemsContextPath = sContextPath;

                //check if we have all the data we need for conversion
                if ((!!(sMaterial)) && (!!(compcap)) && (!!(scompcapUom)) && (scompcapUom !== sTargetQuantityUnit) && (sIndicator !== "D")) {

                    aPromises.push(this._convertUomQP(sMaterial, compcap, scompcapUom, sTargetQuantityUnit, sContextPath).then(function (fConvQty, sRow) {
                        this.aCompCaps[fConvQty[1]] = fConvQty[0]

                    }.bind(this),
                        function (error) {
                            if (this.byId("undoQPbutton").getVisible()) {
                                MessageBox.error(error);
                            }
                            this.byId("inputVehicleId").setEnabled(true);
                            this.byId("inputTrailerID").setEnabled(true);
                            this.byId("undoQPbutton").setVisible(false);
                            this.byId("QPbutton").setVisible(true);
                            oTable.setBusy(false);
                            return
                        }.bind(that)));
                } else {
                }
            }
            //now fill the compartments
            Promise.all(aPromises).then(this.fillCompartments.bind(this));

            //edit screenfunctions
            this.byId("inputVehicleId").setEnabled(false);
            this.byId("inputTrailerID").setEnabled(false);
            this.byId("undoQPbutton").setVisible(true);
            this.byId("QPbutton").setVisible(false);
        },

        fillCompartments: function (oDependants) {
            var SOModel = this.getModel("SalesOrder");
            var aRows = SOModel.getProperty("/to_OrdersChangeItems/results");
            var oTable = this.byId("soItemTable");
            oTable.setBusy(true);
            var fTotalQuantity = Number(this.ogLine.TargetQuantity);
            for (var i = 0; i <= aRows.length - 1; i++) {
                var oRow = aRows[i];
                var sContextPath = oRow.zzvehicle + "-" + oRow.zztrailer + "-" + oRow.zzcomp;
                var sMaterial = oRow.matnr;
                var compcap = oRow.zzcompcap;
                var scompcapUom = oRow.zzcompcapuom;
                var sTargetQuantityUnit = oRow.TargetQuantityUnit;
                //row is not to be deleted and has capacity that is not 0
                if (oRow.indicator !== "D" && compcap && compcap > 0) {
                    if (fTotalQuantity >= this.aCompCaps[sContextPath]) {
                        SOModel.setProperty("/to_OrdersChangeItems/results/" + i + "/TargetQuantity", this.aCompCaps[sContextPath])
                        SOModel.setProperty("/to_OrdersChangeItems/results/" + i + "/TargetQuantityConv", this.aCompCaps[sContextPath]);
                        fTotalQuantity = fTotalQuantity - this.aCompCaps[sContextPath];
                        if (i === aRows.length - 1) {
                            var sMatnr = SOModel.getProperty("/to_OrdersChangeItems/results/" + i + "/matnr")
                            MessageBox.alert("Material " + sMatnr + " has " + fTotalQuantity + " KG unallocated!")
                            oTable.setBusy(false);
                        }

                    }
                    else if (fTotalQuantity > 0) {
                        var rowIndex = i;
                        var fRemainingQuantity = fTotalQuantity.toPrecision(6); //round to 3 decimal
                        this._convertUom(sMaterial, fTotalQuantity, sTargetQuantityUnit, scompcapUom).then(function (fConvQty) {
                            SOModel.setProperty("/to_OrdersChangeItems/results/" + rowIndex + "/TargetQuantity", fRemainingQuantity)
                            SOModel.setProperty("/to_OrdersChangeItems/results/" + rowIndex + "/TargetQuantityConv", fConvQty);
                            oTable.setBusy(false);

                        },
                            function (error) {
                                if (this.byId("undoQPbutton").getVisible()) {
                                    MessageBox.error(error);
                                }
                                oTable.setBusy(false);

                            }.bind(this));
                        fTotalQuantity = fTotalQuantity - fTotalQuantity;
                    }
                    //totalquanttiy = 0
                    else {
                        SOModel.setProperty("/to_OrdersChangeItems/results/" + i + "/TargetQuantity", 0)
                        SOModel.setProperty("/to_OrdersChangeItems/results/" + i + "/TargetQuantityConv", 0);
                        if (i === aRows.length - 1) {
                            oTable.setBusy(false);
                        }
                    }
                }
                else {
                    if (i === aRows.length - 1) {
                        oTable.setBusy(false);
                    }
                }
            }
        },

        onPressUndoQP: function (oEvent) {
            var SOModel = this.getModel("SalesOrder");
            var aRows = SOModel.getProperty("/to_OrdersChangeItems/results");
            var oTable = this.byId("soItemTable");
            var fTotalQuantity = this.ogLine.TargetQuantity;
            for (var i = 0; i <= aRows.length - 1; i++) {
                var oRow = aRows[i];
                var compcap = oRow.zzcompcap;
                var scompcapUom = oRow.zzcompcapuom;
                var sTargetQuantityUnit = oRow.TargetQuantityUnit;
                //row is not to be deleted and has capacity that is not 0
                if (oRow.indicator !== "D" && compcap && compcap > 0) {
                    SOModel.setProperty("/to_OrdersChangeItems/results/" + i + "/TargetQuantity", 0)
                    SOModel.setProperty("/to_OrdersChangeItems/results/" + i + "/TargetQuantityConv", "");
                }
            }
            this.byId("inputVehicleId").setEnabled(true);
            this.byId("inputTrailerID").setEnabled(true);
            this.byId("undoQPbutton").setVisible(false);
            this.byId("QPbutton").setVisible(true);
        },


        convertQuan: function (oSalesModel) {
            var oModel = this.getOwnerComponent().getModel(),
                matnr = oSalesModel.getProperty("/to_OrdersChangeItems/results/0/matnr"),
                aItems = oSalesModel.oData.to_OrdersChangeItems.results;

            for (var i = 0; i < aItems.length; i++) {
                if (aItems[i].indicator === 'I') {
                    oModel.callFunction(
                        "/ConvertMaterialUnit", {
                        method: "GET",
                        urlParameters: {
                            InMeins: aItems[i].zzcompcapuom,
                            Matnr: aItems[i].matnr,
                            Menge: aItems[i].zzcompcap
                        },
                        success: function (oData, response) {
                            arr = oData.results
                        },
                        error: function (oError) {
                        }
                    });
                }
            }
        }
    });
});
