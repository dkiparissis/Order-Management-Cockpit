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

    return BaseController.extend("helpe.fastentryso.controller.Object_V", {

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
            this.getRouter().getRoute("object_V").attachPatternMatched(this._onObjectMatched, this);
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
                "Title": "Vessel/Pipeline",
                "Text": "Create Sales Order",
                "Icon": "sap-icon://BusinessSuiteInAppSymbols/icon-vessel"
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

            this.getView().setModel(new JSONModel({ hasContract: true }), "contractModel");   // + evkontos 20.4.2024
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
                "oihantyp": "",
                "oih_licin": "",
                "inco1": "",
                "oic_mot": this.getView().getModel("SalesOrder").getProperty("/mot"),
                "oic_motDesc": this.getView().getModel("SalesOrder").getProperty("/motDesc")
            });
            this.getView().getModel("SalesOrder").refresh();
        },

        onPressDeleteLine: function (oEvent) {
            var sData = this.getView().getModel("SalesOrder").getData();
            var aIndexes = oEvent.getSource().getBindingContext("SalesOrder").getPath().split("/");
            var iIndex = aIndexes[aIndexes.length - 1]
            sData.to_OrdersChangeItems.results.splice(iIndex, 1);
            this.getView().getModel("SalesOrder").refresh();
        },

        onPressCancel: function () {
            var sPreviousHash = History.getInstance().getPreviousHash();

            if (sPreviousHash !== undefined) {
                history.go(-1);
            } else {
                this.getRouter().navTo("worklist", {}, true);
            }
        },

        onPressSave: function () {
            // var bHasContract = this.getView().getModel("contractModel").getProperty("/hasContract");

            if (this._validateInputs("Vessel")) {
                if (this.salesOrder) {
                    this.editSo();
                } else {
                    this.saveSo();
                }
            } else {
                //MessageBox.error("Please fill in all mandatory fields.");
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
                iItemNum = iItemNum + 10;
                var oItem = oModelData.to_OrdersChangeItems.results[i];

                if ((!(oItem?.indicator)) || (oItem?.indicator) !== "D") {
                    var oObj = {};

                    if (bHasContract) {
                        oObj = {
                            "ContractNo": oModelData.SalesContract,
                            "ContractItem": oItem.SalesContractItem,
                            "MaterialLong": oItem.matnr,
                            // "Zzvehicle": oItem.zzvehicle,    // - evkontos 25.4.2024
                            "Zzvehicle": oModelData.zzvehicle.substring(0, 20),  // + evkontos 25.4.2024
                            "TargetQty": (+oItem.TargetQuantity).toString(),
                            "TargetQu": oItem.TargetQuantityUnit,
                            "Zzvendor": oModelData.zzvendor,
                            "Zzimo": oModelData.zzimo,
                            "Zzdestid": oModelData.zzdestid,
                            "Incoterms1": oItem.inco1,
                            "OicMot": oModelData.mot,
                            "OihLicin": oItem.oih_licin,
                            "Oihantyp": oItem.oihantyp,
                            "Zzitbrand": oItem.zzitbrand
                        };
                    } else {
                        oObj = {
                            "ItmNumber": iItemNum + "",
                            "MaterialLong": oItem.matnr,
                            // "Zzvehicle": oItem.zzvehicle,    // - evkontos 25.4.2024
                            "Zzvehicle": oModelData.zzvehicle.substring(0, 20),  // + evkontos 25.4.2024
                            "Zztrailer": oItem.zztrailer,
                            "TargetQty": (+oItem.TargetQuantity).toString(),
                            "TargetQu": oItem.TargetQuantityUnit,
                            "Zzcomp": oItem.zzcomp,
                            "Zzcompcap": (+oItem.zzcompcap).toString(),
                            "Zzcompcapuom": oItem.zzcompcapuom,
                            "Zzvendor": oModelData.zzvendor,
                            "Zzimo": oModelData.zzimo,
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
                    "Plant": oModelData.werks,
                    "ReqDateH": this.formatter.UTCDate(oModelData.vdatu),
                    "IntercompKunnr": oModelData.IntercompanyPartner,
                    "ShipToKunnr": oModelData.ShipToParty,
                    "BillTo": (!!(oModelData.BillToParty)) ? oModelData.BillToParty : oModelData.ShipToParty,
                    "Bstnk": oModelData.bstnk,
                    "Vsart": oModelData.ShippingType,
                    "Zzhandid": oModelData.zzhandid,
                    "toSOVesselsItemCreate": aItems,
                    "toSOVesselsCreateReturn": []
                };
            } else {
                oPayload = {
                    "SalesOrg": oModelData.vkorg,
                    "SoldTo": oModelData.kunnr,
                    "DistrChan": oModelData.vtweg,
                    "Division": oModelData.spart,
                    "DocType": oModelData.auart,
                    "Zzmrnssdn": oModelData.zzmrnssdn,
                    "Zzseal": "",
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

            var sCreatePath = (bHasContract) ? "/SOVesselsCreateSet" : "/SODirectEntryCreateSet",
                sReturnPath = (bHasContract) ? "toSOVesselsCreateReturn" : "toSODirectEntryReturn";

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
                    // "Zzvehicle": oItem.zzvehicle,                // - evkontos 28.4.2024
                    "Zzvehicle": oItem.zzvehicle.substring(0, 20),  // + evkontos 28.4.2024
                    "Zzvendor": oModelData.zzvendor,
                    "Updateflag": (!!(oItem.indicator)) ? oItem.indicator : "U"
                };

                if (bInclude) {
                    aItems.push(oObj);
                }
            }

            var oPayload = {
                "Vbeln": this.salesOrder,
                "ReqDateH": this.formatter.UTCDate(oModelData.vdatu),
                "Bstnk": oModelData.bstnk,
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

        /* editSo: function () {
            var sData = this.getView().getModel("SalesOrder").getData();
            var i, j, n;
            var navArray = [];
            n = sData.to_OrdersChangeItems.results.length;
            if (n > 0) {
                for (i = 0; i < n; i++) {
                    var arr =
                    {
                        "Posnr": sData.to_OrdersChangeItems.results[i].SalesOrderItem,
                        // "TargetQty": sData.to_OrdersChangeItems.results[i].TargetQuantity,       // - evkontos 13.4.2024
                        "TargetQty": (+sData.to_OrdersChangeItems.results[i].TargetQuantity).toString(),    // + evkontos 13.4.2024
                        "TargetQu": sData.to_OrdersChangeItems.results[i].ContractTargetQuantityUnit,
                        "Incoterms1": sData.to_OrdersChangeItems.results[i].inco1,
                        "OihLicin": sData.to_OrdersChangeItems.results[i].oih_licin,
                        "Zzvehicle": this.getView().getModel("SalesOrder").getData().zzvehicle,
                        "Zzvendor": this.getView().getModel("SalesOrder").getData().zzvendor,
                        // "ZzcardidSo": "",
                        "Updateflag": "U",
                    }
                        ;
                    navArray.push(arr);
                }
            }

            var oData =
            {
                "Vbeln": this.salesOrder,
                // "ReqDateH": this.getView().getModel("SalesOrder").getData().vdatu,   // - evkontos 8.4.2024
                "ReqDateH": this.formatter.UTCDate(this.getView().getModel("SalesOrder").getData().vdatu),  // + evkontos 8.4.2024
                "Bstnk": this.getView().getModel("SalesOrder").getData().bstnk,
                // "Zzseal": "", 
                "Updateflag": "U",
                "BillTo": sData.BillToParty,  // + evkontos 19.4.2024
                "toSOChangeItem": navArray,
                "toSOChangeReturn": []
            };
            var that = this;
            this.getView().getModel().create("/SalesOrderChangeSet", oData,
                {
                    success: function (oData) {
                    that.byId("messagePopoverBtn").setVisible(true);
                    sap.ui.core.BusyIndicator.hide();

                    var msgs = [];
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


                        MessageBox.success(oData.toSOChangeReturn.results[3].Message, {
                            actions: [MessageBox.Action.OK],
                            emphasizedAction: MessageBox.Action.OK,
                            onClose: function () {
                                that.getRouter().navTo("worklist", {}, true);
                                // that.getView().getModel("SalesOrder").setData();
                               
                            }
                        });
                        
                        // var i, n;
                        // var msgs = [];
                        // n = oData.toSOMotTrucksCrReturn.results.length;
                        // for (i = 0; i < n; i++) {
                        //     var Messages = {
                        //         type: "Success",
                        //         title: oData.toSOMotTrucksCrReturn.results[i].Message,
                        //         description: oData.toSOMotTrucksCrReturn.results[i].Message,
                        //         subtitle: 'Example of subtitle',
                        //         counter: i + 1
                        //     };
                        //     msgs.push(Messages);
                        // }
                        // var oModelmsg = new JSONModel();
                        // oModelmsg.setData(msgs);
                        // that.getView().setModel(oModelmsg);
                        // that.byId("messagePopoverBtn").addDependent(that.oMessagePopover);

                    },
                    error: function (oError) {
                        // sap.ui.core.BusyIndicator.hide();
                    }
                });

        }, */

        /* - evkontos 20.4.2024: total refactory
        onPressSave: function () {

            if (this._validateInputs()) {    // + evkontos 16.4.2024
                if (this.salesOrder) {
                    this.editSo();
                }
                else 
                {

                var sData = this.getView().getModel("SalesOrder").getData();
                sap.ui.core.BusyIndicator.show();

                var i, j, n;
                var navArray = [];
                n = sData.to_OrdersChangeItems.results.length;
                if (n > 0) {
                    for (i = 0; i < n; i++) {

                        var arr = {
                            "ContractNo": this.getView().getModel("SalesOrder").getData().SalesContract,
                            "ContractItem": sData.to_OrdersChangeItems.results[i].SalesOrderItem,
                            "MaterialLong": sData.to_OrdersChangeItems.results[i].matnr,
                            "Zzvehicle": this.getView().getModel("SalesOrder").getData().zzvehicle,
                            // "TargetQty": sData.to_OrdersChangeItems.results[i].TargetQuantity,       // - evkontos 13.4.2024
                            "TargetQty": (+sData.to_OrdersChangeItems.results[i].TargetQuantity).toString(),    // + evkontos 13.4.2024
                            "TargetQu": sData.to_OrdersChangeItems.results[i].ContractTargetQuantityUnit,
                            "Zzvendor": this.getView().getModel("SalesOrder").getData().zzvendor,
                            "Zzimo": this.getView().getModel("SalesOrder").getData().zzimo,
                            "Zzdestid": this.getView().getModel("SalesOrder").getData().zzdestid,
                            // "Zzloadid": this.getView().getModel("SalesOrder").getData().zzloadid,
                            "Incoterms1": sData.to_OrdersChangeItems.results[i].inco1,
                            "OicMot": this.getView().getModel("SalesOrder").getProperty("/mot"),
                            "OihLicin": sData.to_OrdersChangeItems.results[i].oih_licin,
                            "Oihantyp": sData.to_OrdersChangeItems.results[i].oihantyp,
                            // "Zzitbrand": this.getView().byId('select').getSelectedItem().getText()   // - evkontos 8.4.2024 
                            "Zzitbrand": sData.to_OrdersChangeItems.results[i].zzitbrand   // + evkontos 8.4.2024
                        };
                        navArray.push(arr);
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
                    // "ReqDateH": this.getView().getModel("SalesOrder").getData().vdatu,                       // - evkontos 15.4.2024
                    "ReqDateH": this.formatter.UTCDate(this.getView().getModel("SalesOrder").getData().vdatu),  // + evkontos 15.4.2024
                    "IntercompKunnr": this.getView().getModel("SalesOrder").getData().IntercompanyPartner,
                    "ShipToKunnr": this.getView().getModel("SalesOrder").getData().ShipToParty,
                    "BillTo": (!!(sData.BillToParty)) ? sData.BillToParty : sData.ShipToParty,  // + evkontos 19.4.2024
                    "Bstnk": this.getView().getModel("SalesOrder").getData().bstnk,
                    "Vsart": this.getView().getModel("SalesOrder").getProperty("/ShippingType"),
                    "Zzhandid": this.getView().getModel("SalesOrder").getProperty("/zzhandid"),
                    "toSOVesselsItemCreate": navArray,
                    "toSOVesselsCreateReturn": [
                    ]
                };
                var that = this;

                this.getView().getModel().create("/SOVesselsCreateSet", payload, {
                    success: function (oData) {
                        that.byId("messagePopoverBtn").setVisible(true);
                            sap.ui.core.BusyIndicator.hide();
        
                            var msgs = [];
                        n = oData.toSOVesselsCreateReturn.results.length;
                        for (i = 0; i < n; i++) {
                            if(oData.toSOVesselsCreateReturn.results[i].Type == 'S')
                            {
                                oData.toSOVesselsCreateReturn.results[i].Type = "Success"
                            }
                            else if(oData.toSOVesselsCreateReturn.results[i].Type == 'W')
                            {
                                oData.toSOVesselsCreateReturn.results[i].Type = "Warning"
                            }
                            else if(oData.toSOVesselsCreateReturn.results[i].Type == 'E')
                            {
                                oData.toSOVesselsCreateReturn.results[i].Type = "Error"
                            }
                            var Messages = {
                                type: oData.toSOVesselsCreateReturn.results[i].Type,
                                title: oData.toSOVesselsCreateReturn.results[i].Message,
                                description: oData.toSOVesselsCreateReturn.results[i].Message,
                                counter: i + 1
                            };
                            msgs.push(Messages);
                        }
                        var oModelmsg = new JSONModel();
                        oModelmsg.setData(msgs);
                        that.getView().setModel(oModelmsg,"oModelmsg");
                        that.byId("messagePopoverBtn").addDependent(that.oMessagePopover);
                        
                        var i, n;
                        n = oData.toSOVesselsCreateReturn.results.length
                        for (i = 0; i < n; i++) 
                        {
                            if(oData.toSOVesselsCreateReturn.results[i].Id == 'V1' && oData.toSOVesselsCreateReturn.results[i].Number == '311')
                            MessageBox.success(oData.toSOVesselsCreateReturn.results[i].Message, {
                                actions: [MessageBox.Action.OK],
                                emphasizedAction: MessageBox.Action.OK,
                                onClose: function () {
                                    // that.getRouter().navTo("worklist", {}, true);
                                    that.getView().getModel("SalesOrder").setData();
                                }
                            });
                        }
                    },
                    error: function (oError) {
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
            this._onValueHelpRequest("Close").close();
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
            var sObjectId = oEvent.getParameter("arguments").objectId;
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
                // zztrailer: "",
                ShipToParty: "",
                to_OrdersChangeItems: { results: [] }

            });
            this.getView().byId("messagePopoverBtn").setVisible(false);
            this.setModel(oModel, "SalesOrder");

            var S1 = this.getOwnerComponent().getModel("S1");
            this.getView().setModel(S1, "S1");

            var editableModel = this.getOwnerComponent().getModel("editableModel");
            this.getView().setModel(editableModel, "editableModel");

            var textModel = new JSONModel();
            var objProp={
                "Text" : "Vessel/Pipeline - Create Sales Order",
            };

            var SOModel = this.getOwnerComponent().getModel("SOModel");
            if (this.getOwnerComponent().getModel("SOModel").oData.SalesOrder !== undefined && this.getOwnerComponent().getModel("SOModel").oData.SalesOrder !== null) {
                objProp={
                    // "Text" : "Edit Sales Order "+  this.getOwnerComponent().getModel("SOModel").oData.SalesOrder + "- Truck/Train"
                    // "Text" : "Vessel/Pipeline - Edit of Sales Order " + this.getOwnerComponent().getModel("SOModel").oData.SalesOrder
                    "Text": "Vessel/Pipeline - " + (editableModel.getProperty("/onlyDisplay") ? "Edit" : "Display") + 
                    " of Sales Order " + this.getOwnerComponent().getModel("SOModel").oData.SalesOrder,
                };
                if(this.getOwnerComponent().getModel("SOModel").oData.ContractValidityEndDate !== null && this.getOwnerComponent().getModel("SOModel").oData.ContractValidityEndDate !== undefined)
                {
                var validTillDate = this.getOwnerComponent().getModel("SOModel").oData.ContractValidityEndDate.toDateString();
                this.getOwnerComponent().getModel("SOModel").oData.ContractValidityEndDate = validTillDate;
                }
                this.getView().setModel(SOModel, "SalesOrder");
                this.salesOrder = this.getOwnerComponent().getModel("SOModel").oData.SalesOrder;
            
                this._fillSalesContractMaterialsModel(this.getOwnerComponent().getModel("SOModel").oData.SalesContract);    // + evkontos 14.4.2024
            }
            textModel.setData(objProp,"textModel");
            this.getView().setModel(textModel, "textModel");
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
                        // zztrailer: "",
                        ShipToParty: "",
                        to_OrdersChangeItems: { results: [] }
                    });
                    this.setModel(oModel, "SalesOrder");
                    // textModel -> default from onInit
                    this.getView().getModel("textModel").setProperty("/Text", "Create Sales Order");
                    // if (Object.keys(editableModel.getData()).length === 0) {
                    this._setEditableModel(true, true);
                    // }
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
                        // zztrailer: "",
                        ShipToParty: "",
                        to_OrdersChangeItems: { results: [] }
                    });
                    this.setModel(oModel, "SalesOrder");
                    this.getView().getModel("textModel").setProperty("/Text", "Create Sales Order without Contract");
                    // if (Object.keys(editableModel.getData()).length === 0) {
                    this._setEditableModel(true, true);
                    // }
                    this.getView().getModel("contractModel").setProperty("/hasContract", false);    // + evkontos 20.4.2024
                    break;

                case "display":
                    this.getView().getModel("textModel").setProperty("/Text", "Display Sales Order " + sObjectId);
                    // if (Object.keys(editableModel.getData()).length === 0) {
                    this._setEditableModel(false, false);
                    // }
                    break;

                case "edit":
                    this.getView().getModel("textModel").setProperty("/Text", "Edit Sales Order " + sObjectId);
                    // if (Object.keys(editableModel.getData()).length === 0) {
                    this._setEditableModel(false, true);
                    // }
                    break;
            }
        },

        // + evkontos 15.4.2024
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
                                this.getView().getModel("contractModel").setProperty("/hasContract", true);    // + evkontos 19.4.2024
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

            this.currentEditingPath = oEvent.getSource().getBindingContext("SalesOrder")?.getPath() || ""; // + evkontos 20.4.2024
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
                    InitiallyVisibleFields = "UnitOfMeasure,UnitOfMeasure_Text";
                    searchHelpText = "Unit Of Measure";
                    break;

                case "ZSD_CDS_B_TL_DEST2":
                    InitiallyVisibleFields = "Vstel,Destid,Desttext,Werks,WerksName,IsLand,Vkorg,VkorgDesc,Vtweg,VtwegDesc,Spart,SpartDesc,Auart,AuartDesc"
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
                    InitiallyVisibleFields = "licin,lctxt,lictp,matnr,SoldToParty,certf1";
                    searchHelpText = "License ID";
                    //i338362 license id VH
                    this.selectedrow = oEvent.getSource().getBindingContext("SalesOrder").sPath.split("/")[3];
                    break;

                case "ZSD_CDS_B_HANDLINGTYPE_VH":
                    InitiallyVisibleFields = "HandlingType,HandlingTypeDesc,HandID";
                    searchHelpText = "Handling Type";
                    break;

                case "ZSD_CDS_B_IntPartner_VH":
                    InitiallyVisibleFields = "IntercompanyPartner,IntercompanyPartnerName,land1";
                    searchHelpText = "Intercompany Partner";
                    break;

                // + evkontos 14.5.2024
                case "VesselVHSet":
                    InitiallyVisibleFields = "Imo,Name";
                    searchHelpText = 'Vessel';
                    break;

                // + evkontos 20.4.2024: only without contract
                case "ZMM_CDS_B_MATERIAL_VH":
                    InitiallyVisibleFields = "matnr,werks,maktx,name1,mtart,mtbez,matkl,wgbez,bismt";
                    searchHelpText = "Material";
                    break;

                // + evkontos 20.4.2024: only without contract
                case "ZSD_CDS_B_CustomerSalesArea":
                    InitiallyVisibleFields = "Customer,CustomerName,Country,SalesOrganization,SalesOrganizationName,DistributionChannel,DistributionChannelName,SalesGroup,SalesGroupName,Division,DivisionName";
                    searchHelpText = "Customer";
                    break;

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

        onCancelValueHelp: function () {
            this.byId("selectDialog").close();
            this._pValueHelpDialog.destroy;
            this._pValueHelpDialog = null;
            this.getView().destroyDependents();
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
                    // this.getView().getModel("SalesOrder").setProperty("/ShiptoLand", shipToPartyLand);
                    this.contract_SalesOrganization = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[1].mProperties.text;
                    this.contract_DistributionChannel = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[2].mProperties.text;
                    this.contract_OrganizationDivision = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[3].mProperties.text;
                    this.contract_bukrs = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[11].mProperties.text;

                    var custRef = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[12].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/bstnk", custRef);

                    // { - evkontos 14.4.2024: Moved code to internal method
                    //For Matnr and contract item Search Help
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
                    //For Matnr and contract item Search Help
                    // } - evkontos 14.4.2024
                    this._fillSalesContractMaterialsModel(selectedValue);   // + evkontos 14.4.2024

                    break;
                //I338362 as far as i can tell this is never used.
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
                    this.getView().getModel("SalesOrder").setProperty("/UnitOfMeasure", selectedValue);
                    break;

                //Intercompany Partner 
                // case "":
                //     this.getView().getModel("SalesOrder").setProperty("/UnitOfMeasure", selectedValue);
                //     break;

                //DestId
                case "ZSD_CDS_B_TL_DEST":
                    this.getView().getModel("SalesOrder").setProperty("/zzdestid", selectedValue);
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
                    // var path = this.getView().getModel("SalesOrder").getData().to_OrdersChangeItems.results.length - 1;  // - evkontos 25.4.2024
                    // this.getView().getModel("SalesOrder").setProperty("/to_OrdersChangeItems/results/" + path + "/oih_licin", selectedValue);    // - evkontos 25.4.2024
                    oSalesModel.setProperty(this.currentEditingPath + "/oih_licin", selectedValue); // + evkontos 25.4.2024
                    break;

                case "ZSD_CDS_B_HANDLINGTYPE_VH":
                    // var path = this.getView().getModel("SalesOrder").getData().to_OrdersChangeItems.results.length - 1;  // - evkontos 25.4.2024
                    // this.getView().getModel("SalesOrder").setProperty("/to_OrdersChangeItems/results/" + path + "/oihantyp", selectedValue); // - evkontos 25.4.2024
                    oSalesModel.setProperty(this.currentEditingPath + "/oihantyp", selectedValue);  // + evkontos 25.4.2024
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
                    var plant = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[3].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/werks", plant);
                    var plantname = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[4].mProperties.text;
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
                    // var path = this.getView().getModel("SalesOrder").getData().to_OrdersChangeItems.results.length - 1; // - evkontos 25.4.2024
                    // this.getView().getModel("SalesOrder").setProperty("/to_OrdersChangeItems/results/" + path + "/inco1", selectedValue); // - evkontos 25.4.2024
                    oSalesModel.setProperty(this.currentEditingPath + "/inco1", selectedValue); // + evkontos 25.4.2024
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
                    break;  // + evkontos 25.4.2024

                // + evkontos 13.4.2024
                case "VesselVHSet":
                    this.getView().getModel("SalesOrder").setProperty("/zzimo", selectedValue);
                    var sVehicle = this.getView().byId('idPOSchedulePage_table0').getSelectedItem().getCells()[1].mProperties.text;
                    this.getView().getModel("SalesOrder").setProperty("/zzvehicle", sVehicle);
                    break;

                // + evkontos 20.4.2024: only without contract
                case "ZMM_CDS_B_MATERIAL_VH":
                    oSalesModel.setProperty(this.currentEditingPath + "/matnr", selectedValue);
                    this.contract_Matnr = selectedValue;
                    break;

                // + evkontos 20.4.2024: only without contract
                case "ZSD_CDS_B_CustomerSalesArea":
                    oSalesModel.setProperty(this.currentEditingPath + "/kunnr", selectedValue);
                    oSalesModel.setProperty(this.currentEditingPath + "/name1", oSelectedContext.getProperty("CustomerName"));
                    oSalesModel.setProperty(this.currentEditingPath + "/land1", oSelectedContext.getProperty("Country"));
                    break;

                default:
                    break;
            }

            this.byId("selectDialog").close();

            //To Destroy the dependants on View 
            this._pValueHelpDialog.destroy;
            this._pValueHelpDialog = null;
            this._vValueHelpDialog = null; // + evkontos 20.4.2024
            this.getView().destroyDependents();
        },

        // + evkontos 8.4.2024
        onSelectDialogAfterClose: function (oEvent) {
            this._pValueHelpDialog.destroy;
            this._pValueHelpDialog = null;
            this._vValueHelpDialog = null; // + evkontos 20.4.2024
            this.getView().destroyDependents();
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
                    var startFilter = new sap.ui.model.Filter("ModeOfTransport", "EQ", '03');
                    var startFilter1 = new sap.ui.model.Filter("ModeOfTransport", "EQ", '07');
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

        /* - evkontos 14.4.2024: Total refactory
        handleSuggestionContractItemSelect : function(oEvent) {
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
            // oSalesModel.setProperty(sInputPath + "/SalesOrderItem", oSelectedObject.SalesContractItem);  // - ekontos 26.4.2024
            oSalesModel.setProperty(sInputPath + "/SalesContractItem", oSelectedObject.SalesContractItem);  // + ekontos 26.4.2024

            this.contract_Matnr = oSelectedObject.matnr;    // + evkontos 15.4.2024
        },

        // + evkontos 16.4.2024
        // _validateInputs: function () {
        //     var oSalesModel = this.getView().getModel("SalesOrder"),
        //         oData = oSalesModel.getData(),
        //         aItems = oData?.to_OrdersChangeItems?.results,
        //         bHasContract = this.getView().getModel("contractModel").getProperty("/hasContract"),
        //         bValid = aItems.length > 0;

        //     if (((!(oData.SalesContract)) && (bHasContract)) ||
        //         ((!(oData.kunnr)) && (!bHasContract)) ||
        //         (!(oData.ShipToParty)) ||
        //         (!(oData.zzdestid)) ||
        //         (!(oData.vstel)) ||
        //         (!(oData.zzhandid)) ||
        //         (!(oData.ShippingType)) ||
        //         (!(oData.vdatu))) {
        //         bValid = false;
        //     }

        //     if (bValid) {
        //         aItems.forEach(function (oItem) {
        //             if ((!(oItem.matnr)) ||
        //                 (!(oItem.TargetQuantity)) ||
        //                 (!(oItem.TargetQuantityUnit)) ||
        //                 (!(oItem.oihantyp)) ||
        //                 (!(oItem.inco1))) {
        //                 bValid = false;
        //             }
        //         });
        //     }

        //     return bValid;
        // }

    });

});
