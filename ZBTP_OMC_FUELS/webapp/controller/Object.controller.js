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
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (BaseController, JSONModel, History, formatter, MessageBox, MessagePopover, MessageItem, Link, Fragment, Filter, FilterOperator) {
    "use strict";

    return BaseController.extend("helpe.fastentryso.controller.Object", {

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

            // var oViewModel = new JSONModel({
            //         busy : true,
            //         delay : 0
            //     });

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
            // var objProp={
            //     "EntitySet" : ""
            // }
            // smartValueHelpModel.setData(objProp);
            this.getView().setModel(smartValueHelpModel, "smartValueHelpModel");
            // this.byId("messagePopoverBtn").addDependent(this.oMessagePopover);

            // { + evkontos 15.4.2024: Default texts for Create
            this.getView().setModel(new JSONModel({
                "Title": "Truck/Train",
                "Text": "Create Sales Order",
                "Icon": "sap-icon://shipping-status",
                "Item": "Sales Order Item"
            }), "textModel")
            // } + evkontos 15.4.2024

            // { + evkontos 16.4.2024
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
            // } + evkontos 16.4.2024

            this.getView().setModel(new JSONModel([]), "compartmentData");  // + evkontos 11.4.2024
            this.getView().setModel(new JSONModel([]), "vehicleData");      // + evkontos 11.4.2024
            this.getView().setModel(new JSONModel({ hasContract: true }), "contractModel");      // + evkontos 19.4.2024
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

        /* - evkontos 11.4.2024: not used anymore
        onPressNewLine: function () {
            var sData = this.getView().getModel("SalesOrder").getData();
            sData.to_OrdersChangeItems.results.push({
                "SalesOrderItem": "",
                "ContractOrderQuantity": "",
                "ContractTargetQuantity": "",
                "OpenContractQuantity": "",
                "ContractTargetQuantityUnit": "",
                "matnr": "",
                "TargetQuantity": "",
                "TargetQuantityUnit": "",
                "zzcomp": "",
                "zzcompcap": "",
                "zzcompcapuom": "",
                "oihantyp": "",
                "oih_licin": "",
                "inco1": "",
                "oic_mot": this.getView().getModel("SalesOrder").getProperty("/mot"),
                "oic_motDesc": this.getView().getModel("SalesOrder").getProperty("/motDesc")
            });
            this.getView().getModel("SalesOrder").refresh();
        }, */

        /* - evkontos 11.4.2024: not used anymore
        onPressDeleteLine: function (oEvent) {
            var sData = this.getView().getModel("SalesOrder").getData();
            var aIndexes = oEvent.getSource().getBindingContext("SalesOrder").getPath().split("/");
            var iIndex = aIndexes[aIndexes.length - 1]
            sData.to_OrdersChangeItems.results.splice(iIndex, 1);
            this.getView().getModel("SalesOrder").refresh();
        }, */

        // + evkontos 16.4.2024: repurposed
        onPressDeleteLine: function (oEvent) {
            var oSalesModel = this.getView().getModel("SalesOrder"),
                oDeletedContext = oEvent.getSource().getBindingContext("SalesOrder"),
                sDeletionPath = oDeletedContext.getPath();

            oSalesModel.setProperty(sDeletionPath + "/indicator", "D");
        },

        onPressCancel: function () {
            var sPreviousHash = History.getInstance().getPreviousHash();

            if (sPreviousHash !== undefined) {
                history.go(-1);
            } else {
                this.getRouter().navTo("worklist", {}, true);
            }
        },

        /* - evkontos 19.4.2024: total refactory
        editSo: function () {
            var sData = this.getView().getModel("SalesOrder").getData();
            var i, j, n;
            var navArray = [];
            n = sData.to_OrdersChangeItems.results.length;
            if (n > 0) {
                for (i = 0; i < n; i++) {

                    var bInclude = true;
                    if ((sData.to_OrdersChangeItems.results[i].indicator === "D") &&
                        ((sData.to_OrdersChangeItems.results[i].SalesOrderItem === "000000") ||
                        (sData.to_OrdersChangeItems.results[i].SalesOrderItem === ""))) {
                        bInclude = false;
                    }

                    var arr = {
                        // "Posnr": sData.to_OrdersChangeItems.results[i].SalesOrderItem,                   // - evkontos 14.4.2024
                        "Posnr": (sData.to_OrdersChangeItems.results[i].indicator === "I") ? "000000" : sData.to_OrdersChangeItems.results[i].SalesOrderItem,   // - evkontos 14.4.2024
                        // "TargetQty": sData.to_OrdersChangeItems.results[i].TargetQuantity,               // + evkontos 12.4.2024
                        "TargetQty": (+sData.to_OrdersChangeItems.results[i].TargetQuantity).toString(),    // + evkontos 12.4.2024
                        "TargetQu": sData.to_OrdersChangeItems.results[i].ContractTargetQuantityUnit,
                        "Incoterms1": sData.to_OrdersChangeItems.results[i].inco1,
                        // "Incoterms2": "",
                        "OihLicin": sData.to_OrdersChangeItems.results[i].oih_licin,
                        // "Zzvehicle": this.getView().getModel("SalesOrder").getData().zzvehicle,  // - evkontos 14.4.2024
                        "Zzvehicle": sData.to_OrdersChangeItems.results[i].zzvehicle,               // + evkontos 14.4.2024
                        // "Zztrailer": this.getView().getModel("SalesOrder").getData().zztrailer,  // - evkontos 14.4.2024
                        "Zztrailer": sData.to_OrdersChangeItems.results[i].zztrailer,               // + evkontos 14.4.2024
                        "Zzdrivercode": this.getView().getModel("SalesOrder").getData().zzdrivercode,
                        "Zzdriverfname": this.getView().getModel("SalesOrder").getData().zzdriverfname,
                        "Zzdriverlname": this.getView().getModel("SalesOrder").getData().zzdriverlname,
                        "Zzvendor": this.getView().getModel("SalesOrder").getData().zzvendor,
                        "ZzcardidSo" : this.getView().getModel("SalesOrder").getData().zzcardidso,
                        // "Updateflag": "U", // - evkontos 13.4.2024
                        "Updateflag": (!!(sData.to_OrdersChangeItems.results[i].indicator)) ? sData.to_OrdersChangeItems.results[i].indicator : "U", // + evkontos 13.4.2024
                    
                        // { + evkontos 14.4.2024
                        "ContractNo": this.getView().getModel("SalesOrder").getData().SalesContract,
                        "ContractItem": sData.to_OrdersChangeItems.results[i].SalesOrderItem,
                        "MaterialLong": sData.to_OrdersChangeItems.results[i].matnr,
                        "Zzcomp": sData.to_OrdersChangeItems.results[i].zzcomp,
                        "Zzcompcap": (+sData.to_OrdersChangeItems.results[i].zzcompcap).toString(),
                        "Zzcompcapuom": sData.to_OrdersChangeItems.results[i].zzcompcapuom,
                        "Zzdestid": this.getView().getModel("SalesOrder").getData().zzdestid,
                        "OicMot": sData.to_OrdersChangeItems.results[i].oic_mot,
                        "Oihantyp": sData.to_OrdersChangeItems.results[i].oihantyp,
                        "Zzitbrand": sData.to_OrdersChangeItems.results[i].zzitbrand                 
                        // } + evkontos 14.4.2024
                    };
                    
                    if (bInclude) { // + evkontos 16.4.2024
                        navArray.push(arr);
                    }
                }
            }

            var oData =
            {
                "Vbeln": this.salesOrder,
                "ReqDateH": this.getView().getModel("SalesOrder").getData().vdatu,
                "Bstnk": this.getView().getModel("SalesOrder").getData().bstnk,
                // "Zzseal": "", 
                "Updateflag": "U",
                "BillTo": sData.ShipToParty,  // + evkontos 19.4.2024
                "toSOChangeItem": navArray,
                "toSOChangeReturn": []
            };
            var that = this;
            this.getView().getModel().create("/SalesOrderChangeSet", oData,
                {
                    // method: "PUT",
                    success: function (oData, oResponse) {
                        that.byId("messagePopoverBtn").setVisible(true);
                        sap.ui.core.BusyIndicator.hide();

                        var msgs = [],
                            sErrorMsg = "";  // + evkontos 14.4.2024
                        n = oData.toSOChangeReturn.results.length;
                        for (i = 0; i < n; i++) {
                            if(oData.toSOChangeReturn.results[i].Type == 'S')
                            {
                                oData.toSOChangeReturn.results[i].Type = "Success"
                            }
                            else if(oData.toSOChangeReturn.results[i].Type == 'W')
                            {
                                oData.toSOChangeReturn.results[i].Type = "Warning"
                            }
                            else if(oData.toSOChangeReturn.results[i].Type == 'E')
                            {
                                oData.toSOChangeReturn.results[i].Type = "Error"
                                sErrorMsg += oData.toSOChangeReturn.results[i].Message + "\n";
                            }
                            var Messages = {
                                type: oData.toSOChangeReturn.results[i].Type,
                                title: oData.toSOChangeReturn.results[i].Message,
                                description: oData.toSOChangeReturn.results[i].Message,
                                counter: i + 1
                            };
                            msgs.push(Messages);
                        }
                        var oModelmsg = new JSONModel();
                        oModelmsg.setData(msgs);
                        that.getView().setModel(oModelmsg,"oModelmsg");
                        that.byId("messagePopoverBtn").addDependent(that.oMessagePopover);

                        // { + evkontos 14.4.2024
                        if (!!(sErrorMsg)) {
                            MessageBox.error(sErrorMsg);
                        } else {
                        // } + evkontos 14.4.2024
                            MessageBox.success(oData.toSOChangeReturn.results[3].Message, {
                                actions: [MessageBox.Action.OK],
                                emphasizedAction: MessageBox.Action.OK,
                                onClose: function () {
                                    that.getRouter().navTo("worklist", {}, true);
                                    // that.getView().getModel("SalesOrder").setData();

                                }
                            });
                        }   // + evkontos 14.4.2024
                    },
                    error: function (oError) {
                        // sap.ui.core.BusyIndicator.hide();
                    }
                });
        }, */

        onPressSave: function () {
            // var bHasContract = this.getView().getModel("contractModel").getProperty("/hasContract");

            if (this._validateInputs("Fuel")) {
                if (this.salesOrder) {
                    this.editSo();
                } else {
                    this.saveSo();
                }
            } else {
                //  MessageBox.error("Please fill in all mandatory fields.");
            }
        },

        saveSo: function () {
            var oModel = this.getView().getModel("SalesOrder"),
                oModelData = oModel.getData(),
                bHasContract = this.getView().getModel("contractModel").getProperty("/hasContract"),
                aItems = [],
                that = this;
            var iItemNum = 0;
            for (var i = 0; i < oModelData.to_OrdersChangeItems.results.length; i++) {

                var oItem = oModelData.to_OrdersChangeItems.results[i];
                iItemNum = iItemNum + 10;
                if ((!(oItem?.indicator)) || (oItem?.indicator) !== "D") {
                    var oObj = {};

                    if (bHasContract) {
                        oObj = {
                            "ContractNo": oModelData.SalesContract,
                            "ContractItem": oItem.SalesContractItem,
                            "MaterialLong": oItem.matnr,
                            "Zzvehicle": oItem.zzvehicle,
                            "Zztrailer": oItem.zztrailer,
                            "TargetQty": (+oItem.TargetQuantity).toString(),
                            "TargetQu": oItem.TargetQuantityUnit,
                            "Zzcomp": oItem.zzcomp,
                            "Zzcompcap": (+oItem.zzcompcap).toString(),
                            "Zzcompcapuom": oItem.zzcompcapuom,
                            "Zzvendor": oModelData.zzvendor,
                            "Zzdrivercode": oModelData.zzdrivercode,
                            "Zzdriverfname": oModelData.zzdriverfname,
                            "Zzdriverlname": oModelData.zzdriverlname,
                            "Zzdestid": oModelData.zzdestid,
                            "Incoterms1": oItem.inco1,
                            "OicMot": oModelData.mot,
                            "OihLicin": oItem.oih_licin,
                            "Oihantyp": oItem.oihantyp,
                            "Zzitbrand": oItem.zzitbrand,
                            "ZzcardidSo": oModelData.zzcardidso
                        };
                    } else {
                        oObj = {
                            "ItmNumber": iItemNum + "",
                            "MaterialLong": oItem.matnr,
                            "Zzvehicle": oItem.zzvehicle,
                            "Zztrailer": oItem.zztrailer,
                            "TargetQty": (+oItem.TargetQuantity).toString(),
                            "TargetQu": oItem.TargetQuantityUnit,
                            "Zzcomp": oItem.zzcomp,
                            "Zzcompcap": (+oItem.zzcompcap).toString(),
                            "Zzcompcapuom": oItem.zzcompcapuom,
                            "Zzvendor": oModelData.zzvendor,
                            "Zzimo": "",
                            "Zzdrivercode": oModelData.zzdrivercode,
                            "Zzdriverfname": oModelData.zzdriverfname,
                            "Zzdriverlname": oModelData.zzdriverlname,
                            "Zztankid": oModelData.zztankid,
                            "Zzmeterid": oModelData.zzmeterid,
                            "Zzdestid": oModelData.zzdestid,
                            "Zzloadid": oModelData.zzloadid,
                            "Zzitbrand": oItem.zzitbrand,
                            "Incoterms1": oItem.inco1,
                            "Incoterms2": "",
                            "OicMot": oModelData.mot,
                            "OihLicin": oItem.oih_licin,
                            "ZzcardidSo": oModelData.zzcardidso,
                            "Oihantyp": oItem.oihantyp
                        };
                    }

                    aItems.push(oObj);
                }
            }

            var oPayload = {};
            if (bHasContract) {
                oPayload = {
                    "SalesOrg": oModelData.vkorg,
                    "DistrChan": oModelData.vtweg,
                    "Division": oModelData.spart,
                    "DocType": oModelData.auart,
                    "RefDoc": oModelData.SalesContract,
                    "Zzmrnssdn": oModelData.zzmrnssdn,
                    "Zzseal": oModelData.zzseal,    // + evkontos 24.4.2024
                    "Plant": oModelData.werks,
                    "ReqDateH": this.formatter.UTCDate(oModelData.vdatu),
                    "IntercompKunnr": oModelData.IntercompanyPartner,
                    "ShipToKunnr": oModelData.ShipToParty,
                    "BillTo": (!!(oModelData.BillToParty)) ? oModelData.BillToParty : oModelData.ShipToParty,
                    "Bstnk": oModelData.bstnk,
                    "Vsart": oModelData.ShippingType,
                    "Zzhandid": oModelData.zzhandid,
                    "toSOMotTrucksItemCreate": aItems,
                    "toSOMotTrucksCrReturn": []
                };
            } else {
                oPayload = {
                    "SalesOrg": oModelData.vkorg,
                    "SoldTo": oModelData.kunnr,
                    "DistrChan": oModelData.vtweg,
                    "Division": oModelData.spart,
                    "DocType": oModelData.auart,
                    "Zzmrnssdn": oModelData.zzmrnssdn,
                    // "Zzseal": "",                // - evkontos 24.4.2024
                    "Zzseal": oModelData.zzseal,    // + evkontos 24.4.2024
                    "Plant": oModelData.werks,
                    "ReqDateH": this.formatter.UTCDate(oModelData.vdatu),
                    "IntercompKunnr": oModelData.IntercompanyPartner,
                    "ShipToKunnr": oModelData.ShipToParty,
                    "BillTo": (!!(oModelData.BillToParty)) ? oModelData.BillToParty : oModelData.kunnr,
                    "Bstnk": oModelData.bstnk,
                    "Vsart": oModelData.ShippingType,
                    "Zzhandid": oModelData.zzhandid,
                    "toSODirectEntryItem": aItems,
                    "toSODirectEntryReturn": [],
                    "toSODirectEntrySingleReturn": []
                };
            }

            var sCreatePath = (bHasContract) ? "/SOMotTrucksCreateSet" : "/SODirectEntryCreateSet",
                sReturnPath = (bHasContract) ? "toSOMotTrucksCrReturn" : "toSODirectEntryReturn";

            sap.ui.core.BusyIndicator.show();
            this.getView().getModel().create(sCreatePath, oPayload, {
                success: function (oData) {
                    that.processMessages(oData[sReturnPath].results, that);
                },
                error: function (oData, oError) {
                    sap.ui.core.BusyIndicator.hide();
                }
            });

        },

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
                    "TargetQu": oItem.TargetQuantityUnit,
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
                    //I338362 if no contract send in item, if contract send in contractitem
                    "ContractItem": (oItem.SalesContractItem === "000000") ? oItem.SalesOrderItem : oItem.SalesContractItem,
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
                // "ReqDateH": oModelData.vdatu,                        // - evkontos 25.4.2024
                "ReqDateH": this.formatter.UTCDate(oModelData.vdatu),   // + evkontos 25.4.2024
                "Bstnk": oModelData.bstnk,
                "Zzseal": oModelData.zzseal,    // + evkontos 24.4.2024
                "Updateflag": "U",
                "BillTo": oModelData.ShipToParty,
                "toSOChangeItem": aItems,
                "toSOChangeReturn": []
            };
            sap.ui.core.BusyIndicator.show();
            this.getView().getModel().create("/SalesOrderChangeSet", oPayload, {
                success: function (oData, oResponse) {
                    that.processMessages(oData.toSOChangeReturn.results, that);
                },
                error: function (oError) {
                    sap.ui.core.BusyIndicator.hide();
                }
            });
        },

        /* - evkontos 19.4.2024: total refactory
        onPressSave: function () {

            if (this._validateInputs()) {    // + evkontos 16.4.2024
                if (this.salesOrder) {
                    this.editSo();
                }
                else {

                    var sData = this.getView().getModel("SalesOrder").getData();
                    sap.ui.core.BusyIndicator.show();

                    var i, j, n;
                    var navArray = [];
                    n = sData.to_OrdersChangeItems.results.length;
                    if (n > 0) {
                        for (i = 0; i < n; i++) {

                            // { + evkontos 13.4.2024
                            if ((!(sData.to_OrdersChangeItems.results[i]?.indicator)) || 
                                (sData.to_OrdersChangeItems.results[i]?.indicator) !== "D") {
                            // } + evkontos 13.4.2024
                            var arr = {
                                "ContractNo": this.getView().getModel("SalesOrder").getData().SalesContract,
                                "ContractItem": sData.to_OrdersChangeItems.results[i].SalesOrderItem,
                                "MaterialLong": sData.to_OrdersChangeItems.results[i].matnr,
                                // "Zzvehicle": this.getView().getModel("SalesOrder").getData().zzvehicle,  // - evkontos 12.4.2024
                                "Zzvehicle": sData.to_OrdersChangeItems.results[i].zzvehicle,               // + evkontos 12.4.2024
                                // "Zztrailer": this.getView().getModel("SalesOrder").getData().zztrailer,  // - evkontos 12.4.2024
                                "Zztrailer": sData.to_OrdersChangeItems.results[i].zztrailer,               // + evkontos 12.4.2024
                                // "TargetQty": sData.to_OrdersChangeItems.results[i].TargetQuantity,       // - evkontos 13.4.2024
                                "TargetQty": (+sData.to_OrdersChangeItems.results[i].TargetQuantity).toString(),    // + evkontos 13.4.2024
                                // "TargetQu": sData.to_OrdersChangeItems.results[i].ContractTargetQuantityUnit,    // - evkontos 19.4.2024
                                "TargetQu": sData.to_OrdersChangeItems.results[i].TargetQuantityUnit,               // + evkontos 19.4.2024
                                "Zzcomp": sData.to_OrdersChangeItems.results[i].zzcomp,
                                // "Zzcompcap": sData.to_OrdersChangeItems.results[i].zzcompcap,                // - evkontos 13.4.2024
                                "Zzcompcap": (+sData.to_OrdersChangeItems.results[i].zzcompcap).toString(),     // + evkontos 13.4.2024
                                "Zzcompcapuom": sData.to_OrdersChangeItems.results[i].zzcompcapuom,
                                "Zzvendor": this.getView().getModel("SalesOrder").getData().zzvendor,
                                "Zzdrivercode": this.getView().getModel("SalesOrder").getData().zzdrivercode,
                                "Zzdriverfname": this.getView().getModel("SalesOrder").getData().zzdriverfname,
                                "Zzdriverlname": this.getView().getModel("SalesOrder").getData().zzdriverlname,
                                "Zzdestid": this.getView().getModel("SalesOrder").getData().zzdestid,
                                // "Zzloadid": this.getView().getModel("SalesOrder").getData().zzloadid,
                                // "Incoterms1": sData.ChamberMaterial[i].Incoterms1,
                                "Incoterms1": sData.to_OrdersChangeItems.results[i].inco1,
                                "OicMot": this.getView().getModel("SalesOrder").getProperty("/mot"),
                                "OihLicin": sData.to_OrdersChangeItems.results[i].oih_licin,
                                "Oihantyp": sData.to_OrdersChangeItems.results[i].oihantyp,
                                // "Zzitbrand": this.getView().byId('select').getSelectedItem().getText(),// - evkontos 8.4.2024 
                                "Zzitbrand": sData.to_OrdersChangeItems.results[i].zzitbrand,   // + evkontos 8.4.2024
                                "ZzcardidSo" : this.getView().getModel("SalesOrder").getData().zzcardidso
                                // "Updateflag": (!!(sData.to_OrdersChangeItems.results[i].indicator)) ? sData.to_OrdersChangeItems.results[i].indicator : "U", // + evkontos 13.4.2024
                            };
                            navArray.push(arr);

                            } // + evkontos 13.4.2024
                        }
                    }

                    var payload = {
                        "SalesOrg": this.getView().getModel("SalesOrder").getData().vkorg,
                        "DistrChan": this.getView().getModel("SalesOrder").getData().vtweg,
                        "Division": this.getView().getModel("SalesOrder").getData().spart,
                        "DocType": this.getView().getModel("SalesOrder").getData().auart,
                        "RefDoc": this.getView().getModel("SalesOrder").getData().SalesContract,
                        "Zzmrnssdn": this.getView().getModel("SalesOrder").getData().zzmrnssdn,  //MRN Number input by user
                        // "Zzseal": this.getView().getModel("SalesOrder").getData().SealId,  //Seal ID input by user
                        "Plant": this.getView().getModel("SalesOrder").getData().werks,
                        // "ReqDateH": this.getView().getModel("SalesOrder").getData().vdatu,   // - evkontos 8.4.2024
                        "ReqDateH": this.formatter.UTCDate(this.getView().getModel("SalesOrder").getData().vdatu),  // + evkontos 8.4.2024
                        "IntercompKunnr": this.getView().getModel("SalesOrder").getData().IntercompanyPartner,
                        "ShipToKunnr": this.getView().getModel("SalesOrder").getData().ShipToParty,
                        "BillTo": (!!(sData.BillToParty)) ? sData.BillToParty : sData.ShipToParty,  // + evkontos 19.4.2024
                        "Bstnk": this.getView().getModel("SalesOrder").getData().bstnk,
                        "Vsart": this.getView().getModel("SalesOrder").getProperty("/ShippingType"),
                        "Zzhandid": this.getView().getModel("SalesOrder").getProperty("/zzhandid"),
                        "toSOMotTrucksItemCreate": navArray,
                        "toSOMotTrucksCrReturn": [
                        ]
                    };
                    var that = this;

                    this.getView().getModel().create("/SOMotTrucksCreateSet", payload, {
                        success: function (oData) {
                            that.byId("messagePopoverBtn").setVisible(true);
                            sap.ui.core.BusyIndicator.hide();

                            var msgs = [];
                            n = oData.toSOMotTrucksCrReturn.results.length;
                            for (i = 0; i < n; i++) {
                                if(oData.toSOMotTrucksCrReturn.results[i].Type == 'S')
                                {
                                    oData.toSOMotTrucksCrReturn.results[i].Type = "Success"
                                }
                                else if(oData.toSOMotTrucksCrReturn.results[i].Type == 'W')
                                {
                                    oData.toSOMotTrucksCrReturn.results[i].Type = "Warning"
                                }
                                else if(oData.toSOMotTrucksCrReturn.results[i].Type == 'E')
                                {
                                    oData.toSOMotTrucksCrReturn.results[i].Type = "Error"
                                }
                                var Messages = {
                                    type: oData.toSOMotTrucksCrReturn.results[i].Type,
                                    title: oData.toSOMotTrucksCrReturn.results[i].Message,
                                    description: oData.toSOMotTrucksCrReturn.results[i].Message,
                                    counter: i + 1
                                };
                                msgs.push(Messages);
                            }
                            var oModelmsg = new JSONModel();
                            oModelmsg.setData(msgs);
                            that.getView().setModel(oModelmsg,"oModelmsg");
                            that.byId("messagePopoverBtn").addDependent(that.oMessagePopover);

                            // var i, n;
                            n = oData.toSOMotTrucksCrReturn.results.length
                            for (i = 0; i < n; i++) {
                                if (oData.toSOMotTrucksCrReturn.results[i].Id == 'V1' && 
                                    oData.toSOMotTrucksCrReturn.results[i].Number == '311') {
                                    // MessageBox.success(oData.toSOMotTrucksCrReturn.results[i].Message);
                                    // that.getView().getModel("SalesOrder").setData("");
                                    MessageBox.success(oData.toSOMotTrucksCrReturn.results[i].Message, {
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
                        error: function (oData,oError) {
                            sap.ui.core.BusyIndicator.hide();
                        }
                    });
                }
            // { + evkontos 16.4.2024
            } else {
                MessageBox.error("Please fill in all mandatory fields.");
            }
            // } + evkontos 16.4.2024
        }, */

        _getDate: function (date) {
            if (date !== null) {
                var dDate = new Date(date.getTime());
                var offset = dDate.getTimezoneOffset() / 60;
                var hours = dDate.getHours();
                dDate.setHours(hours - offset);
            }

            return dDate;
        },

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
            this.byId("selectDialog").close();
            // this._onValueHelpRequest("Close").close();
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
        /* - evkontos 15.4.2024: Total refactory
        _onObjectMatched: function (oEvent) {
            var sObjectId = oEvent.getParameter("arguments").objectId
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
                // SalesOrderText:"Create Sales Order - Truck/Train",
                to_OrdersChangeItems: { results: [] }
            });

            var textModel = new JSONModel();
            var objProp = {
                "Text": "Truck/Train - Create Sales Order",
                "Item" : "Sales Order Item"
            };

            // this.getView().setModel(textModel, "textModel");
            this.getView().byId("messagePopoverBtn").setVisible(false);
            this.setModel(oModel, "SalesOrder");
            var editableModel = this.getOwnerComponent().getModel("editableModel");
            this.getView().setModel(editableModel, "editableModel");

            var SOModel = this.getOwnerComponent().getModel("SOModel");
            if (this.getOwnerComponent().getModel("SOModel").oData.SalesOrder !== undefined && 
                this.getOwnerComponent().getModel("SOModel").oData.SalesOrder !== null) {

                objProp = {
                    // "Text" : "Edit Sales Order "+  this.getOwnerComponent().getModel("SOModel").oData.SalesOrder + "- Truck/Train"
                    "Text": "Truck/Train - " + (editableModel.getProperty("/onlyDisplay") ? "Edit" : "Display") + 
                        " of Sales Order " + this.getOwnerComponent().getModel("SOModel").oData.SalesOrder,
                    "Item" : "Position"
                };
                if (this.getOwnerComponent().getModel("SOModel").oData.ContractValidityEndDate !== null && this.getOwnerComponent().getModel("SOModel").oData.ContractValidityEndDate !== undefined) {
                    var validTillDate = this.getOwnerComponent().getModel("SOModel").oData.ContractValidityEndDate.toDateString();
                    this.getOwnerComponent().getModel("SOModel").oData.ContractValidityEndDate = validTillDate;
                }
                this.getView().setModel(SOModel, "SalesOrder");
                this.salesOrder = this.getOwnerComponent().getModel("SOModel").oData.SalesOrder;

                this._fillSalesContractMaterialsModel(this.getOwnerComponent().getModel("SOModel").oData.SalesContract);    // + evkontos 14.4.2024
            }

            textModel.setData(objProp, "textModel");
            this.getView().setModel(textModel, "textModel");

            this.getView().getModel("vehicleData")?.setData([]);        // + evkontos 11.4.2024
            this.getView().getModel("compartmentData")?.setData([]);    // + evkontos 11.4.2024
        }, */

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
                    this.getView().getModel("textModel").setProperty("/Text", "Create Sales Order");
                    // if (Object.keys(editableModel.getData()).length === 0) {
                    this._setEditableModel(true, true);
                    // }
                    this.getView().getModel("contractModel").setProperty("/hasContract", true);    // + evkontos 19.4.2024
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
                    // if (Object.keys(editableModel.getData()).length === 0) {
                    this._setEditableModel(true, true);
                    // }
                    this.getView().getModel("contractModel").setProperty("/hasContract", false);    // + evkontos 19.4.2024
                    break;

                case "display":
                    this.getView().getModel("textModel").setProperty("/Text", "Display Sales Order " + sObjectId);
                    this.getView().getModel("textModel").setProperty("/Item", "Position");
                    // if (Object.keys(editableModel.getData()).length === 0) {
                    this._setEditableModel(false, false);
                    // }
                    break;

                case "edit":
                    this.getView().getModel("textModel").setProperty("/Text", "Edit Sales Order " + sObjectId);
                    this.getView().getModel("textModel").setProperty("/Item", "Position");
                    // if (Object.keys(editableModel.getData()).length === 0) {
                    this._setEditableModel(false, true);
                    // }
                    break;
            }

            this.getView().getModel("vehicleData")?.setData([]);        // + evkontos 11.4.2024
            this.getView().getModel("compartmentData")?.setData([]);    // + evkontos 11.4.2024
        },

        // + evkontos 13.4.2024
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
                    this.getView().getModel("contractModel").setProperty("/hasContract", true);    // + evkontos 19.4.2024
                } else {
                    this.getView().getModel("contractModel").setProperty("/hasContract", false);    // + evkontos 19.4.2024
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
                                that.getView().getModel("contractModel").setProperty("/hasContract", true);    // + evkontos 19.4.2024
                            } else {
                                that.getView().getModel("contractModel").setProperty("/hasContract", false);    // + evkontos 19.4.2024
                            }
                        }
                    },
                    error: function (oError) {
                        console.log(JSON.stringify(oError));
                    }
                });
            }

        },

        // + evkontos 15.4.2024
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
        },

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

            //Get EntitySet Name from the F4 Input Box 
            var entitySet = oEvent.getSource().getCustomData()[0].getValue("entitySet");
            //Get EntitySet Name from the F4 Input Box and set to Model

            var InitiallyVisibleFields;
            var searchHelpText;

            this.currentEditingPath = oEvent.getSource().getBindingContext("SalesOrder")?.getPath() || ""; // + evkontos 13.4.2024
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
                    // InitiallyVisibleFields = "ShipToParty,ShipToPartyName,ShipToPartyLand";
                    InitiallyVisibleFields = "ShipToParty,ShipToPartyName,ShipToPartyLand";
                    searchHelpText = "Ship-To Party";
                    break;

                // { + evkontos 19.4.2024
                case "ZSD_CDS_B_BILLTO_VH":
                    InitiallyVisibleFields = "BillToParty,BillToPartyName,BillToLand";
                    searchHelpText = "Bill-To Party";
                    break;
                // } + evkontos 19.4.2024

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
                    InitiallyVisibleFields = "licin,lctxt,lictp,matnr,SoldToParty,certf1"
                    searchHelpText = "License ID";
                    //i338362 23.04.2024 fix license id VH
                    this.selectedrow = oEvent.getSource().getBindingContext("SalesOrder").sPath.split("/")[3];
                    // this.contract_Matnr = 
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

                // + evkontos 19.4.2024: only without contract
                case "ZMM_CDS_B_MATERIAL_VH":
                    InitiallyVisibleFields = "matnr,werks,maktx,name1,mtart,mtbez,matkl,wgbez,bismt";
                    searchHelpText = "Material";
                    break;

                // + evkontos 20.4.2024: only without contract
                case "ZSD_CDS_B_CustomerSalesArea":
                    InitiallyVisibleFields = "Customer,CustomerName,Country,SalesOrganization,SalesOrganizationName,DistributionChannel,DistributionChannelName,SalesGroup,SalesGroupName,Division,DivisionName";
                    searchHelpText = "Customer";
                    break;

                // Try this Mtest
                // case "VehicleVHSet?$expand=toVehicleVHCopartment":
                //     InitiallyVisibleFields = "Vehicleno,Vehicletype,Islocked"
                //     searchHelpText = "Vehicle ID"
                //     break;

                default:
                    break;
            }
            this.getView().getModel("smartValueHelpModel").setProperty("/EntitySet", entitySet);
            this.getView().getModel("smartValueHelpModel").setProperty("/InitiallyVisibleFields", InitiallyVisibleFields);

            this.getOwnerComponent().getModel("searchHelpTextModel").setProperty("/searchHelpText", searchHelpText);

            var oView = this.getView();

            if (!this._pValueHelpDialog) {
                this._pValueHelpDialog = Fragment.load({
                    id: oView.getId(),
                    name: "helpe.fastentryso.fragment.smart",
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
            // this._pValueHelpDialog = sap.ui.xmlfragment("helpe.fastentryso.fragment.smart", this);
            // this._pValueHelpDialog.setModel(this.getView().getModel());
            // this._pValueHelpDialog.open();
        },

        // + evkontos 11.4.2024
        onVehicleValueHelpRequest: function (oEvent) {
            var oView = this.getView(),
                sVehicleType = oEvent.getSource().data("vehicleType"),
                that = this;

            if (!this._vValueHelpDialog) {
                this._vValueHelpDialog = Fragment.load({
                    id: oView.getId(),
                    name: "helpe.fastentryso.fragment.VehicleValueHelpDialog",
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

        // + evkontos 11.4.2024
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
            aFilters.push(new Filter("Vehicletype", FilterOperator.EQ, sVehicleType));

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

        // + evkontos 11.4.2024
        onVehicleSearch: function (oEvent) {
            var sValue = oEvent.getParameter("value"),
                oFilter = new Filter("Vehicleno", FilterOperator.Contains, sValue),
                oBinding = oEvent.getParameter("itemsBinding");
            oBinding.filter([oFilter]);
        },

        // + evkontos 11.4.2024
        onVehicleCancel: function (oEvent) {
            oEvent.getSource().getBinding("items").filter(null);
        },

        // + evkontos 11.4.2024
        addNewLines: function (aItems, sType) {
            var oData = this.getView().getModel("SalesOrder").getData(),
                oSalesModel = this.getView().getModel("SalesOrder");

            aItems.forEach(function (oItem) {
                oData.to_OrdersChangeItems.results.push({
                    "SalesOrderItem": "",
                    "ContractOrderQuantity": "",
                    "ContractTargetQuantity": "",
                    "OpenContractQuantity": "",
                    "ContractTargetQuantityUnit": "",
                    "matnr": "",
                    "TargetQuantity": "",
                    "TargetQuantityUnit": "",
                    "zzcomp": oItem.Compartmentno,
                    "zzcompcap": +oItem.Volume,
                    "zzcompcapuom": oItem.Uom,
                    "zzvehicle": oSalesModel.getProperty("/zzvehicle"),
                    "zztrailer": sType !== "truck" ? oSalesModel.getProperty("/zztrailer") : "",
                    "oihantyp": "",
                    "oih_licin": "",
                    "inco1": "",
                    "oic_mot": oSalesModel.getProperty("/ShippingType"),
                    "oic_motDesc": oSalesModel.getProperty("/ShippingTypeDesc"),
                    "indicator": "I"
                });
            });
            oSalesModel.refresh();
        },

        // + evkontos 11.4.2024
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
                    this.deleteOldLines(sVehicleno, sVehicletype);
                    this.addNewLines(aCompartments, sVehicletype);
                }
            }

            oEvent.getSource().getBinding("items").filter(null);
        },

        // + evkontos 13.4.2024
        deleteOldLines: function (sVehicleno, sType) {
            var oSalesModel = this.getView().getModel("SalesOrder"),
                sPath = "/to_OrdersChangeItems/results",
                aItems = oSalesModel.getProperty(sPath);

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
                oSalesModel.setProperty(sPath, aItems);
                oSalesModel.refresh();
            }
        },

        // i338362 commenting out because we have another method with the same name
        // onCancelValueHelp: function () {
        //     this.byId("selectDialog").close();
        //     this._pValueHelpDialog.destroy;
        //     this._pValueHelpDialog = null;
        //     this._vValueHelpDialog = null; // + evkontos 19.4.2024
        //     this.getView().destroyDependents();
        // },

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
                    // this.getView().getModel("SalesOrder").setProperty("/ShiptoLand", shipToPartyLand);
                    this.contract_SalesOrganization = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[1].mProperties.text;
                    this.contract_DistributionChannel = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[2].mProperties.text;
                    this.contract_OrganizationDivision = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[3].mProperties.text;
                    this.contract_bukrs = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[11].mProperties.text;

                    var custRef = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[12].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/bstnk", custRef);

                    // { - evkontos 14.4.2024: Moved code to internal method
                    // //For Matnr and contract item Search Help
                    // var model = this.getOwnerComponent().getModel();
                    // var that = this;

                    // model.read("/ZSD_CDS_B_FAST_ENTRY_ITEMS", {
                    //     filters: [
                    //         new sap.ui.model.Filter({
                    //             path: "SalesContract",
                    //             operator: sap.ui.model.FilterOperator.EQ,
                    //             value1: selectedValue
                    //         })],
                    //     success: function (oData, oResponse) {
                    //         if (oData !== undefined) {
                    //             var S1 = that.getOwnerComponent().getModel("S1");
                    //             S1.setData(oData);
                    //             that.getView().setModel(S1, "S1");
                    //         }
                    //     },
                    //     error: function (oError) {
                    //         // alert("Read ERROR");
                    //     }
                    // });
                    // //For Matnr and contract item Search Help
                    // } - evkontos 14.4.2024
                    this._fillSalesContractMaterialsModel(selectedValue);   // + evkontos 14.4.2024

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
                    // this.getView().getModel("SalesOrder").setProperty("/UnitOfMeasure", selectedValue); // - evkontos 13.4.2024
                    oSalesModel.setProperty("/UnitOfMeasure", selectedValue);   // + evkontos 13.4.2024
                    break;

                //Intercompany Partner 
                // case "":
                //     this.getView().getModel("SalesOrder").setProperty("/UnitOfMeasure", selectedValue);
                //     break;

                //DestId
                case "ZSD_CDS_B_TL_DEST":
                    // this.getView().getModel("SalesOrder").setProperty("/zzdestid", selectedValue); // - evkontos 13.4.2024
                    oSalesModel.setProperty("/zzdestid", selectedValue);   // + evkontos 13.4.2024
                    break;

                //LP

                case "ZSD_CDS_B_ShipTo_VH":
                    this.getView().getModel("SalesOrder").setProperty("/ShipToParty", selectedValue);

                    var shipToPartyName = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[1].mProperties.text;
                    var shipToPartyLand = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[2].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/ShipToPartyName", shipToPartyName + ", " + shipToPartyLand);
                    break;

                // { + evkontos 19.4.2024
                case "ZSD_CDS_B_BILLTO_VH":
                    this.getView().getModel("SalesOrder").setProperty("/BillToParty", selectedValue);
                    var billToPartyName = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[1].mProperties.text;
                    var billToPartyLand = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[2].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/BillToPartyName", billToPartyName + ", " + billToPartyLand);
                    break;
                // } + evkontos 19.4.2024

                case "ZSD_CDS_B_LICENSE_VH":
                    // { - evkontos 13.4.2024
                    // var path = this.getView().getModel("SalesOrder").getData().to_OrdersChangeItems.results.length - 1;
                    // this.getView().getModel("SalesOrder").setProperty("/to_OrdersChangeItems/results/" + path + "/oih_licin", selectedValue);
                    // } - evkontos 13.4.2024
                    oSalesModel.setProperty(this.currentEditingPath + "/oih_licin", selectedValue); // + evkontos 13.4.2024
                    break;

                case "ZSD_CDS_B_HANDLINGTYPE_VH":
                    // { - evkontos 13.4.2024
                    // var path = this.getView().getModel("SalesOrder").getData().to_OrdersChangeItems.results.length - 1;
                    // this.getView().getModel("SalesOrder").setProperty("/to_OrdersChangeItems/results/" + path + "/oihantyp", selectedValue);
                    // } - evkontos 13.4.2024
                    oSalesModel.setProperty(this.currentEditingPath + "/oihantyp", selectedValue);  // + evkontos 13.4.2024
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

                    // + evkontos 20.4.2024: only without contract
                    if (!this.getView().getModel("contractModel").getProperty("/hasContract")) {
                        this.contract_SalesOrganization = salesOrg;
                        this.contract_DistributionChannel = distrinChannel;
                        this.contract_OrganizationDivision = division;
                        this.contract_bukrs = "G001";
                    }

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
                    // { - evkontos 13.4.2024
                    // var path = this.getView().getModel("SalesOrder").getData().to_OrdersChangeItems.results.length - 1;
                    // this.getView().getModel("SalesOrder").setProperty("/to_OrdersChangeItems/results/" + path + "/inco1", selectedValue);
                    // } - evkontos 13.4.2024
                    oSalesModel.setProperty(this.currentEditingPath + "/inco1", selectedValue); // + evkontos 13.4.2024
                    break;

                case "ZSD_CDS_B_HANDID_VH":
                    this.getView().getModel("SalesOrder").setProperty("/zzhandid", selectedValue);
                    var HandIdDesc = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[1].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/zzhandid_desc", HandIdDesc);
                    break;

                case "ZSD_CDS_B_IntPartner_VH":
                    this.getView().getModel("SalesOrder").setProperty("/IntercompanyPartner", selectedValue);
                    var IntercompanyPartnerLand = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[2].mProperties.text;
                    // this.getView().getModel("SalesOrder").setProperty("/IntercompanyPartnerLand", IntercompanyPartnerLand);

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

                // + evkontos 19.4.2024: only without contract
                case "ZMM_CDS_B_MATERIAL_VH":
                    oSalesModel.setProperty(this.currentEditingPath + "/matnr", selectedValue);
                    this.contract_Matnr = selectedValue;
                    // + evkontos 21.4.2024: trigger conversion
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
                    // } + evkontos 21.4.2024
                    break;

                // + evkontos 20.4.2024: only without contract
                case "ZSD_CDS_B_CustomerSalesArea":
                    oSalesModel.setProperty(this.currentEditingPath + "/kunnr", selectedValue);
                    oSalesModel.setProperty(this.currentEditingPath + "/name1", oSelectedContext.getProperty("CustomerName"));
                    oSalesModel.setProperty(this.currentEditingPath + "/land1", oSelectedContext.getProperty("Country"));
                    break;

                // case "VehicleVHSet?$expand=toVehicleVHCopartment":
                //     this.getView().getModel("SalesOrder").setProperty("/zzvehicle", selectedValue);
                //     // var driverFname = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[1].mProperties.text;
                //     // var driverLname = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[2].mProperties.text;
                //     // this.getView().getModel("SalesOrder").setProperty("/zzdriverfname", driverFname);
                //     // this.getView().getModel("SalesOrder").setProperty("/zzdriverlname", driverLname);
                //     break;

                default:
                    break;
            }

            this.byId("selectDialog").close();

            //To Destroy the dependants on View 
            //commenitng out because it is done anyway in onSelectDialogAfterClose
            // this._pValueHelpDialog.destroy;
            // this._pValueHelpDialog = null;
            // this._vValueHelpDialog = null; // + evkontos 19.4.2024
            // this.getView().destroyDependents();
        },

        // + evkontos 8.4.2024
        onSelectDialogAfterClose: function (oEvent) {
            this._pValueHelpDialog.destroy;
            this._pValueHelpDialog = null;
            this._vValueHelpDialog = null; // + evkontos 19.4.2024
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
            var oSOModel = this.getView().getModel("SalesOrder");    // + evkontos 20.4.2024
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

                // { + evkontos 19.4.2024
                case "ZSD_CDS_B_BILLTO_VH":

                    var oBindingParams = oEvent.getParameter("bindingParams");

                    var shipTo = this.getView().getModel("SalesOrder").getProperty("/ShipToParty");
                    var startFilter1 = new sap.ui.model.Filter("SalesOrganization", "EQ", this.contract_SalesOrganization);
                    var startFilter2 = new sap.ui.model.Filter("DistributionChannel", "EQ", this.contract_DistributionChannel);
                    var startFilter3 = new sap.ui.model.Filter("OrganizationDivision", "EQ", this.contract_OrganizationDivision);
                    var startFilter4 = new sap.ui.model.Filter("partner", "EQ", shipTo);

                    oBindingParams.filters.push(startFilter1);
                    oBindingParams.filters.push(startFilter2);
                    oBindingParams.filters.push(startFilter3);
                    oBindingParams.filters.push(startFilter4);

                    break;
                // } + evkontos 19.4.2024

                case "ZSD_CDS_B_TL_DEST":
                    if (this.getView().getModel("contractModel").getProperty("/hasContract")) { // + evkontos 20.4.2024: Filter only for contract case
                        var oBindingParams = oEvent.getParameter("bindingParams");
                        var startFilter1 = new sap.ui.model.Filter("Vkorg", "EQ", this.contract_SalesOrganization);
                        var startFilter2 = new sap.ui.model.Filter("Vtweg", "EQ", this.contract_DistributionChannel);
                        var startFilter3 = new sap.ui.model.Filter("Spart", "EQ", this.contract_OrganizationDivision);
                        if (this.getView().getModel("SalesOrder").getProperty("/werks")) {
                            var plantFilter = new sap.ui.model.Filter("Werks", "EQ", this.getView().getModel("SalesOrder").getProperty("/werks"));
                            oBindingParams.filters.push(plantFilter);
                        }
                        if (this.getView().getModel("SalesOrder").getProperty("/auart")) {
                            var OrderTypFilter = new sap.ui.model.Filter("Auart", "EQ", this.getView().getModel("SalesOrder").getProperty("/auart"));
                            oBindingParams.filters.push(OrderTypFilter);
                        }
                        oBindingParams.filters.push(startFilter1);
                        oBindingParams.filters.push(startFilter2);
                        oBindingParams.filters.push(startFilter3);


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
                    break;

                case "ZSD_CDS_B_HANDLINGTYPE_VH":
                    var oBindingParams = oEvent.getParameter("bindingParams");

                    var HandleId = this.getView().getModel("SalesOrder").getProperty("/zzhandid");
                    var startFilter1 = new sap.ui.model.Filter("HandID", "EQ", HandleId);
                    oBindingParams.filters.push(startFilter1);
                    break;

                case "ZSD_CDS_B_IntPartner_VH":
                    // var SalesOrganization = this.getView().getModel("SalesOrder").getProperty("/SalesOrganization");
                    // var DistributionChannel = this.getView().getModel("SalesOrder").getProperty("/DistributionChannel");
                    // var OrganizationDivision = this.getView().getModel("SalesOrder").getProperty("/OrganizationDivision");
                    var SalesOrganization = oSOModel.getProperty("/vkorg"),
                        DistributionChannel = oSOModel.getProperty("/vtweg"),
                        OrganizationDivision = oSOModel.getProperty("/spart");
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

                // + evkontos 19.4.2024: only without contract
                case "ZMM_CDS_B_MATERIAL_VH":
                    var sPlant = this.getView().getModel("SalesOrder").getProperty("/werks"),
                        oBindingParams = oEvent.getParameter("bindingParams"),
                        startFilter1 = new sap.ui.model.Filter("werks", "EQ", sPlant);

                    oBindingParams.filters.push(startFilter1);
                    break;

                // + evkontos 20.4.2024: only without contract
                case "ZSD_CDS_B_CustomerSalesArea":
                    var SalesOrganization = oSOModel.getProperty("/vkorg"),
                        DistributionChannel = oSOModel.getProperty("/vtweg"),
                        OrganizationDivision = oSOModel.getProperty("/spart"),
                        oBindingParams = oEvent.getParameter("bindingParams");

                    var startFilter1 = new sap.ui.model.Filter("SalesOrganization", "EQ", SalesOrganization);
                    oBindingParams.filters.push(startFilter1);

                    var startFilter2 = new sap.ui.model.Filter("DistributionChannel", "EQ", DistributionChannel);
                    oBindingParams.filters.push(startFilter2);

                    var startFilter3 = new sap.ui.model.Filter("Division", "EQ", OrganizationDivision);
                    oBindingParams.filters.push(startFilter3);

                    break;

                default:
                    break;
            }
        },

        // + evkontos 20.4.2024
        onMaterialQtyUoMChange: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext("SalesOrder"),
                sContextPath = oContext.getPath(),
                oSalesModel = this.getView().getModel("SalesOrder"),
                sMaterial = oContext.getProperty("matnr"),
                fQty = oContext.getProperty("TargetQuantity"),
                sUom = oContext.getProperty("TargetQuantityUnit"),
                sPrevUom = oEvent.getParameter("previousSelectedItem")?.getProperty("key"),
                sCompUom = oContext.getProperty("zzcompcapuom"),    // + evkontos 25.4.2024
                oTable = this.getView().getContent()[0].getContent().getItems()[1],
                that = this;

            // if ((!!(sMaterial)) && (!!(fQty)) && (!!(sUom)) && (sUom !== sPrevUom) && (sPrevUom)) {  // - evkontos 25.4.2024
            if ((!!(sMaterial)) && (!!(fQty)) && (!!(sUom)) && (sUom !== sCompUom) && (sCompUom)) {     // + evkontos 25.4.2024
                oTable.setBusy(true);
                // this._convertUom(sMaterial, fQty, sUom, sPrevUom).then(function (fConvQty) { // - evkontos 25.4.2024
                this._convertUom(sMaterial, fQty, sUom, sCompUom).then(function (fConvQty) {    // + evkontos 25.4.2024
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

        /* - evkontos 13.4.2024: Total refactory
        handleSuggestionContractItemSelect: function (oEvent) {
            var Tablepath = this.getView().getModel("SalesOrder").getData().to_OrdersChangeItems.results.length - 1;
            var sPath = oEvent.getParameters().selectedRow.oBindingContexts.S1.sPath.split("/")[2];

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
        } */

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
            // oSalesModel.setProperty(sInputPath + "/SalesOrderItem", oSelectedObject.SalesContractItem);  // - ekontos 16.4.2024
            oSalesModel.setProperty(sInputPath + "/SalesContractItem", oSelectedObject.SalesContractItem);  // + ekontos 16.4.2024

            this.contract_Matnr = oSelectedObject.matnr;    // + evkontos 15.4.2024

            // { + evkontos 21.4.2024: trigger conversion
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
            // } + evkontos 21.4.2024
        },

        onMaterialInputChange: function (oEvent) {
            var oInput = oEvent.getSource();
            /*  sValue = oEvent.getParameter("newValue"),
                aSuggestionItems = this.getView().getModel("S1").getData().results,
                aSuggestionMaterials = aSuggestionItems.map(function(oItem){
                    return oItem.matnr;
                }),
                bFromSuggestion = aSuggestionMaterials.include(sValue);
            
            if (!(bFromSuggestion)) { */
            oInput.setValue("");
            // } 
        },

        // + evkontos 14.4.2024
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

            // { + evkontos 19.4.2024
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
            // } + evkontos 19.4.2024
        }

        // + evkontos 16.4.2024
        // _validateInputs: function () {
        //     var oSalesModel = this.getView().getModel("SalesOrder"),
        //         oData = oSalesModel.getData(),
        //         aItems = oData?.to_OrdersChangeItems?.results,
        //         bHasContract = this.getView().getModel("contractModel").getProperty("/hasContract"),
        //         bValid = aItems.length > 0;
        //     var missingProperties = "";

        //     // if (((!(oData.SalesContract)) && (bHasContract)) ||
        //     //     ((!(oData.kunnr)) && (!bHasContract)) ||
        //     //     (!(oData.ShipToParty)) ||
        //     //     (!(oData.zzdestid)) ||
        //     //     (!(oData.vstel)) ||
        //     //     (!(oData.zzhandid)) ||
        //     //     (!(oData.ShippingType)) ||
        //     //     (!(oData.zzvehicle)) ||
        //     //     (!(oData.zzcardidso)) ||
        //     //     (!(oData.vdatu))) {
        //     //     bValid = false;
        //     // }

        //     // if (bValid) {
        //     //     aItems.forEach(function (oItem) {
        //     //         if (((!!(oItem.indicator)) && (oItem.indicator !== "D")) &&
        //     //             (((!(oItem.matnr)) ||
        //     //                 (!(oItem.TargetQuantity)) ||
        //     //                 (!(oItem.TargetQuantityUnit)) ||
        //     //                 (!(oItem.oihantyp)) ||
        //     //                 (!(oItem.inco1))))) {
        //     //             bValid = false;
        //     //         }
        //     //     });
        //     // }


        //     var missingProperties = "";

        //     if (!(oData.SalesContract) && bHasContract) {
        //         missingProperties += "Sales Contract\n";
        //         bValid = false;
        //     }
        //     if (!(oData.kunnr) && !bHasContract) {
        //         missingProperties += "Customer Number\n";
        //         bValid = false;
        //     }
        //     if (!(oData.ShipToParty)) {
        //         missingProperties += "Ship To Party\n";
        //         bValid = false;
        //     }
        //     if (!(oData.zzdestid)) {
        //         missingProperties += "Destination ID\n";
        //         bValid = false;
        //     }
        //     if (!(oData.vstel)) {
        //         missingProperties += "Sales Office\n";
        //         bValid = false;
        //     }
        //     if (!(oData.zzhandid)) {
        //         missingProperties += "Hand ID\n";
        //         bValid = false;
        //     }
        //     if (!(oData.ShippingType)) {
        //         missingProperties += "Shipping Type\n";
        //         bValid = false;
        //     }
        //     if (!(oData.zzvehicle)) {
        //         missingProperties += "Vehicle\n";
        //         bValid = false;
        //     }
        //     if (!(oData.zzcardidso)) {
        //         missingProperties += "Card ID\n";
        //         bValid = false;
        //     }
        //     if (!(oData.vdatu)) {
        //         missingProperties += "Delivery Date\n";
        //         bValid = false;
        //     }


        //     aItems.forEach(function (oItem) {
        //         if (!!oItem.indicator && oItem.indicator !== "D") {
        //             if (!(oItem.matnr)) {
        //                 missingProperties += "Material Number\n";
        //                 bValid = false;
        //             }
        //             if (!(oItem.TargetQuantity)) {
        //                 missingProperties += "Target Quantity\n";
        //                 bValid = false;
        //             }
        //             if (!(oItem.TargetQuantityUnit)) {
        //                 missingProperties += "Target Quantity Unit\n";
        //                 bValid = false;
        //             }
        //             if (!(oItem.oihantyp)) {
        //                 missingProperties += "Order Item Type\n";
        //                 bValid = false;
        //             }
        //             if (!(oItem.inco1)) {
        //                 missingProperties += "Incoterms\n";
        //                 bValid = false;
        //             }
        //         }
        //     });

        //     MessageBox.error("Please fill in below  fields:\n \n" + missingProperties);
        //     return bValid;
        // }
    });

});
