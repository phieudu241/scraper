var IsAjaxIng = false;

var DataCenter =
    {
        SetTeamOption: function (leagueid) {
            $(".club_list .club_item").each(function () {

                if ($(this).data("no") == leagueid) {
                    $(this).parent().show();
                }
                else {
                    $(this).parent().hide();
                }
            });

            $("[name=n4LeagueId]").val(leagueid);
        },

        SetNationOption: function (confederation) {
            $(".nationality_list .nationality_item").each(function () {

                if ($(this).data("no") == confederation) {
                    $(this).parent().show();
                }
                else {
                    $(this).parent().hide();
                }
            });

            $("[name=n1Confederation]").val(confederation);
        },

        SetCheckSearch: function (obj, type) {

            var strObj = $("[name=" + type + "]").val();


            if ($(obj).prop("checked")) {
                if (strObj == "") strObj = ",";

                strObj = strObj + $(obj).data("no") + ",";
            }
            else {
                strObj = strObj.replace("," + $(obj).data("no") + ",", ",");
                if (strObj == ",") strObj = "";
            }

            $("[name=" + type + "]").val(strObj);
        },

        SetAbilitySearch: function (value, type) {
            $("[name=" + type + "]").val(value);
        },

        SetSkillPoint: function (value, type, target, spid) {
            var targetPoint = $("[name=" + target + "]").val().split('/')[1];
            var strong = $("[name=" + target + "]").val().split('/')[0];

            var point = value.split('/')[1] - targetPoint;

            $("." + type).each(function () {
                $(this).html(parseInt($(this).html()) + point);
            });

            $("[name=" + target + "]").val(value);

            $(".data_detail .thumb .selector_wrap").html("<a href='javascript:;' class='ability en_level" + value.split('/')[0] + "'>" + value.split('/')[0] + "</a>");


            $(".bp_" + spid + " span").each(function () {
                $(this).hide();
            });

            $(".bp_" + spid + " .span_bp" + $("[name=" + target + "]").val().split('/')[0]).show();
        },
        SetSkillPoint2: function (value, type, target) {
            var targetPoint = $("[name=" + target + "]").val();

            var point = value - targetPoint;

            $("." + type).each(function () {
                $(this).html(parseInt($(this).html()) + point);
            });

            $("[name=" + target + "]").val(value);
        },
        GetPlayerList: function () {
            if (IsAjaxIng) return false;
            IsAjaxIng = true;

            $("#divPlayerList").html("");
            $(".tr.loading").show();


            if ($.trim(location.search) != '') {
                $("html, body").stop().animate({ scrollTop: $(".board_list").length ? $(".board_list").offset().top : $(".player_list").offset().top }, 500, 'swing');
            }

            var param = $("#form1").serialize();

            setTimeout(function () {
                $.ajax({
                    type: "POST",
                    url: "/datacenter/PlayerList",
                    data: param + "&n4PageNo=1" + "rd=" + Math.random(),
                    success: function (data) {
                        //$("#strParam").val(param);
                        $("#divPlayerList").html(data);
                        $(".tr.loading").hide();

                        IsAjaxIng = false;
                    },
                    error: function () {
                        alert("정보 조회에 실패 하였습니다. 잠시 후 다시 시도해주세요.");
                        $(".tr.loading").hide();
                        IsAjaxIng = false;
                    }
                });
            }, 300);
        },
        GetPlayerDetail: function (obj, spid, param) {
            var strong = $("[name=Strong" + spid + "]").val().split('/')[0];

            if (param != "" && param != null) {
                param = param + "&spid=" + spid + "&n1Strong=" + strong;
            } else {
                param = "?spid=" + spid + "&n1Strong=" + strong;
            }

            location.href = "/DataCenter/PlayerInfo" + param;
        },
        GetPlayerGrow: function (obj, spid, param) {
            var strong = $("[name=Strong" + spid + "]").val().split('/')[0];

            if (param != "" && param != null) {
                param = param + "&spid=" + spid + "&n1Strong=" + strong;
            } else {
                param = "?spid=" + spid + "&n1Strong=" + strong;
            }

            location.href = "/DataCenter/PlayerGrow" + param;
        },
        GetPlayerGrowTargetList: function () {
            if (IsAjaxIng) return false;
            IsAjaxIng = true;

            $("#divTargetPlayerList").html("");
            $(".tr.loading").show();

            var param = "?strSeason=" + $("[name='strTargetSeason']").val();
            param += "&strOrderby=" + $("[name='strTargetSeason']").val();
            param += "&strPlayerName=" + $("[name='strTargetPlayerName']").val();

            setTimeout(function () {
                $.ajax({
                    type: "POST",
                    url: "/datacenter/PlayerGorwTargetList",
                    data: param + "&n4PageNo=1" + "rd=" + Math.random(),
                    success: function (data) {
                        $("#divTargetPlayerList").html(data);
                        $(".tr.loading").hide();

                        IsAjaxIng = false;
                    },
                    error: function () {
                        alert("정보 조회에 실패 하였습니다. 잠시 후 다시 시도해주세요.");
                        $(".tr.loading").hide();
                        IsAjaxIng = false;
                    }
                });
            }, 300);
        },
        GetPlayerGrowSelect: function (obj, spid) {
            if (IsAjaxIng) return false;
            IsAjaxIng = true;

            $("#playerPreview").hide();
            var strong = $("[name=Strong" + spid + "]").val().split('/')[0];

            setTimeout(function () {
                $.ajax({
                    type: "POST",
                    url: "/datacenter/PlayerPreView",
                    data: "spid=" + spid + "&n1strong=" + strong + "&n1Grow=" + $("[name=n1Grow]").val() + "&rd=" + Math.random(),
                    success: function (data) {
                        $("#playerPreview").html(data);
                        $("#playerPreview").show();
                        IsAjaxIng = false;
                    },
                    error: function () {
                        alert("정보 조회에 실패 하였습니다. 잠시 후 다시 시도해주세요.");
                        IsAjaxIng = false;
                    }
                });
            }, 100);
        },
        GetPlayerGrowCal: function (obj, spid) {
            if (IsAjaxIng) return false;
            IsAjaxIng = true;

            $("#playerPreview").hide();
            var strong = $("[name=Strong" + spid + "]").val().split('/')[0];

            setTimeout(function () {
                $.ajax({
                    type: "POST",
                    url: "/datacenter/PlayerPreView",
                    data: "spid=" + spid + "&n1strong=" + strong + "&n1Grow=" + $("[name=n1Grow]").val() + "&rd=" + Math.random(),
                    success: function (data) {
                        $("#playerPreview").html(data);
                        $("#playerPreview").show();
                        IsAjaxIng = false;
                    },
                    error: function () {
                        alert("정보 조회에 실패 하였습니다. 잠시 후 다시 시도해주세요.");
                        IsAjaxIng = false;
                    }
                });
            }, 100);
        },
        GetPlayerPreview: function (obj, spid) {
            if (IsAjaxIng) return false;
            IsAjaxIng = true;

            $("#playerPreview").hide();
            var strong = $("[name=Strong" + spid + "]").val().split('/')[0];

            setTimeout(function () {
                $.ajax({
                    type: "POST",
                    url: "/datacenter/PlayerPreView",
                    data: "spid=" + spid + "&n1strong=" + strong + "&n1Grow=" + $("[name=n1Grow]").val() + "&rd=" + Math.random(),
                    success: function (data) {
                        $("#playerPreview").html(data);
                        $("#playerPreview").show();
                        IsAjaxIng = false;
                    },
                    error: function () {
                        alert("정보 조회에 실패 하였습니다. 잠시 후 다시 시도해주세요.");
                        IsAjaxIng = false;
                    }
                });
            }, 100);
        },
        GetPlayerPriceChart: function (obj, spid, strong, target) {
            setTimeout(function () {
                $.ajax({
                    type: "POST",
                    url: "/datacenter/PlayerPriceGraph",
                    data: "spid=" + spid + "&n1strong=" + strong + "&rd=" + Math.random(),
                    success: function (data) {
                        $("#" + target).html(data);
                    },
                    error: function () {
                        alert("정보 조회에 실패 하였습니다. 잠시 후 다시 시도해주세요.");
                    }
                });
            }, 100);
        },
        GetPlayerCompare: function (spid2) {
            if (IsAjaxIng) return false;
            IsAjaxIng = true;

            $("#playerCompare").hide();

            var spid1 = $("#PlayerVs1").val();

            var strong1 = $("[name=Strong" + spid1 + "]").val().split('/')[0];
            var strong2 = $("[name=Strong" + spid2 + "]").val().split('/')[0];

            setTimeout(function () {
                $.ajax({
                    type: "POST",
                    url: "/datacenter/PlayerVs",
                    data: "spid1=" + spid1 + "&n1strong1=" + strong1 + "&n1Grow1=" + $("[name=n1Grow]").val() + "&spid2=" + spid2 + "&n1strong2=" + strong2 + "&n1Grow2=" + $("[name=n1Grow]").val() + "&rd=" + Math.random(),
                    success: function (data) {
                        $("#playerCompare").html(data);
                        $("#playerCompare").show();
                        IsAjaxIng = false;
                    },
                    error: function () {
                        alert("정보 조회에 실패 하였습니다. 잠시 후 다시 시도해주세요.");
                        IsAjaxIng = false;
                    }
                });
            }, 100);

            return false;
        },
        GetPlayerCompareVS: function (spid1, spid2) {
            if (IsAjaxIng) return false;
            IsAjaxIng = true;

            //$("#playerCompare").hide();

            if (spid1 == "") {
                alert("비교할 선수를 선택해주세요.");
                return false;
            }

            var strong1 = $("[name=VS_Strong" + spid1 + "]").val().split('/')[0];
            var strong2 = $("[name=VS_Strong" + spid2 + "]").val().split('/')[0];
            var grow1 = $("[name=VS_Grow" + spid1 + "]").val();
            var grow2 = $("[name=VS_Grow" + spid2 + "]").val();
            var live1 = $("[name=VS_LivePer" + spid1 + "]").val();
            var live2 = $("[name=VS_LivePer" + spid2 + "]").val();

            setTimeout(function () {
                $.ajax({
                    type: "POST",
                    url: "/datacenter/PlayerVs",
                    data: "spid1=" + spid1 + "&n1strong1=" + strong1 + "&n1Grow1=" + grow1 + "&spid2=" + spid2 + "&n1strong2=" + strong2 + "&n1Grow2=" + grow2 + "&rd=" + Math.random(),
                    success: function (data) {
                        $("#playerCompare").html(data);
                        $("#playerCompare").show();
                        IsAjaxIng = false;
                    },
                    error: function () {
                        alert("정보 조회에 실패 하였습니다. 잠시 후 다시 시도해주세요.");
                        IsAjaxIng = false;
                    }
                });
            }, 100);
        },
        SetPlayerFavorit: function (obj, spid, type) {
            $(obj).attr("onclick", "return false;");

            window.setTimeout(function () {
                $.getJSON("/datacenter/SetPlayerFavorit", { spid: spid, type : type, rd: Math.random() }, function (retData) {
                    if (retData.rtnCode == "0") {
                        //alert(retData.rtnMsg);

                        if (type == 1)
                        {
                            $(".collect_" + spid).fadeIn();
                            window.setTimeout(function () {
                                if ($("[name=n1Favorit]").val() == "1") {
                                    DataCenter.GetPlayerList();
                                } else {
                                    $(".collect_" + spid).fadeOut();
                                }
                            }, 1000);

                            $(obj).addClass("active");
                            $(obj).attr("onclick", "DataCenter.SetPlayerFavorit(this, " + spid + ", 0)");

                            $(".players_utils_" + spid).find(".btn_collect").addClass("active");
                            $(".players_utils_" + spid).find(".btn_collect").attr("onclick", "DataCenter.SetPlayerFavorit(this, " + spid + ", 0)");
                        }
                        else if(type == 2)
                        {
                            $(".collect_" + spid).fadeIn();
                            window.setTimeout(function () {
                                if ($("[name=n1Favorit]").val() == "1") {
                                    DataCenter.GetPlayerList();
                                } else {
                                    $(".collect_" + spid).fadeOut();
                                }
                            }, 1000);

                            $(obj).attr("onclick", "DataCenter.SetPlayerFavorit(this, " + spid + ", 2)");

                            $(".players_utils_" + spid).find(".btn_collect").attr("onclick", "DataCenter.SetPlayerFavorit(this, " + spid + ", 2)");
                        }
                        else
                        {
                            $(obj).removeClass("active");
                            $(obj).attr("onclick", "DataCenter.SetPlayerFavorit(this, " + spid + ", 1)");

                            $(".players_utils_" + spid).find(".btn_collect").removeClass("active");
                            $(".players_utils_" + spid).find(".btn_collect").attr("onclick", "DataCenter.SetPlayerFavorit(this, " + spid + ", 1)");

                            $(".alert_del_" + spid).fadeIn();
                            window.setTimeout(function () {
                                if ($("[name=n1Favorit]").val() == "1") {
                                    DataCenter.GetPlayerList();
                                } else {
                                    $(".alert_del_" + spid).fadeOut();
                                }
                            }, 1000);
                        }

                    } else {
                        $(".alert_" + spid).fadeIn();
                        window.setTimeout(function () {
                            $(".alert_" + spid).fadeOut();
                        }, 1000);


                        $(obj).attr("onclick", "DataCenter.SetPlayerFavorit(this, " + spid + ", " + type + ")");
                    }
                });
            }, 300);
        },
        SetPlayerAssessment: function (obj, spid) {
            $(obj).attr("onclick", "return false;");

            var point = $("[name=radio_wrap1]:checked").val();

            if (point > 0) {

                window.setTimeout(function () {
                    $.getJSON("/datacenter/SetPlayerAssessment", { n8SpId: spid, n4Point: point, rd: Math.random() }, function (retData) {
                        if (retData.rtnCode == "0") {
                            alert(retData.rtnMsg);
                            location.reload();
                        } else {
                            alert(retData.rtnMsg);
                            $(obj).attr("onclick", "DataCenter.SetPlayerAssessment(this, " + spid + ")");
                        }
                    });
                }, 300);
            }
            else {
                alert("평가 항목을 선택 해주세요.");
                $(obj).attr("onclick", "DataCenter.SetPlayerAssessment(this, " + spid + ")");
                return false;
            }
        },
        SetSearch: function () {
            var param = $("#form1").serialize();

            location.href = "/datacenter/index?" + param;
        },

        SearchManager:function()
        {
            $("#sForm").submit();
        },
        SearchManagerReset: function () {
            location.href = "/datacenter/manager";
        },
        SearchTeamColor:function()
        {
            $("#sForm").submit();
        },
        SearchTeamColorReset: function () {
            location.href = "/datacenter/teamcolor";
        }
    }