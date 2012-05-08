$(document).ready(function(){
    // Production steps of ECMA-262, Edition 5, 15.4.4.19
    // Reference: http://es5.github.com/#x15.4.4.19
    if (!Array.prototype.map) {
        Array.prototype.map = function(callback, thisArg) {

            var T, A, k;

            if (this == null) {
                throw new TypeError(" this is null or not defined");
            }

            // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
            var O = Object(this);

            // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
            // 3. Let len be ToUint32(lenValue).
            var len = O.length >>> 0;

            // 4. If IsCallable(callback) is false, throw a TypeError exception.
            // See: http://es5.github.com/#x9.11
            if ({}.toString.call(callback) != "[object Function]") {
                throw new TypeError(callback + " is not a function");
            }

            // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
            if (thisArg) {
                T = thisArg;
            }

            // 6. Let A be a new array created as if by the expression new Array(len) where Array is
            // the standard built-in constructor with that name and len is the value of len.
            A = new Array(len);

            // 7. Let k be 0
            k = 0;

            // 8. Repeat, while k < len
            while(k < len) {

                var kValue, mappedValue;

                // a. Let Pk be ToString(k).
                //   This is implicit for LHS operands of the in operator
                // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
                //   This step can be combined with c
                // c. If kPresent is true, then
                if (k in O) {

                    // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
                    kValue = O[ k ];

                    // ii. Let mappedValue be the result of calling the Call internal method of callback
                    // with T as the this value and argument list containing kValue, k, and O.
                    mappedValue = callback.call(T, kValue, k, O);

                    // iii. Call the DefineOwnProperty internal method of A with arguments
                    // Pk, Property Descriptor {Value: mappedValue, Writable: true, Enumerable: true, Configurable: true},
                    // and false.

                    // In browsers that support Object.defineProperty, use the following:
                    // Object.defineProperty(A, Pk, { value: mappedValue, writable: true, enumerable: true, configurable: true });

                    // For best browser support, use the following:
                    A[ k ] = mappedValue;
                }
                // d. Increase k by 1.
                k++;
            }

            // 9. return A
            return A;
        };      
    }
    if (!Array.prototype.reduce) {
        Array.prototype.reduce = function reduce(accumulator){
            if (this===null || this===undefined) throw new TypeError("Object is null or undefined");
            var i = 0, l = this.length >> 0, curr;

            if(typeof accumulator !== "function") // ES5 : "If IsCallable(callbackfn) is false, throw a TypeError exception."
                throw new TypeError("First argument is not callable");

            if(arguments.length < 2) {
                if (l === 0) throw new TypeError("Array length is 0 and no second argument");
                curr = this[0];
                i = 1; // start accumulating at the second element
            }
            else
                curr = arguments[1];

            while (i < l) {
                if(i in this) curr = accumulator.call(undefined, curr, this[i], i, this);
                ++i;
            }

            return curr;
        };
    }

    var op_add = function (a, b) {
        return a + b;
    };

    var permalink_pattern = /([a-z0-9]{32})\/(\d+)\/(\d+)\/[#]?/;

    var markup_text = function (txt) {
        var trimmed = txt.trim();
        var normalizedWhitespace = trimmed.replace(/^\s+$/gm, '');
        var hasConsecutiveLineBreaks = /[\r\n]{2,}/g.test(normalizedWhitespace);
        var lineBreakPatternText = '(\\r|\\n|\\r\\n|\\n\\r)';
        if (hasConsecutiveLineBreaks)
            lineBreakPatternText = lineBreakPatternText + '{2,}';
        var lineBreakPattern = new RegExp(lineBreakPatternText, "g");
        var withPTags = normalizedWhitespace.replace(lineBreakPattern, '</p>\n<p>');
        return '<p>' + withPTags + '</p>';
    };

    var with_search_row = function (doctype, docid, code) {
        $.each(search_results['documents']['rows'], function(idx, row){
            if ((row['doctype'] == doctype) && (row['docid'] == docid)) {
                code(row);
            }
        });
    };

    var fetch_document = function (doctype, docid, match_id, next) {
        var url = '/api/document/DOCTYPE/DOCID/'.replace('DOCTYPE', doctype).replace('DOCID', docid);
        $.get(url, {
            crossDomain: false,
            cache: true,
        }).success(function(resp){
            next(doctype, docid, match_id, resp); 
        });
    };

    var set_scroll_column_position = function (event_or_callback) {
        var match_title = jQuery('#match-title');
        var rtColumn = jQuery('#rtColumn');
        var scroll_offset = jQuery(window).scrollTop();
        var title_top = match_title.offset().top;
        var scol_top = Math.max(0,
                                title_top - scroll_offset);
        jQuery('#scrollColumn').css({'position': 'fixed',
                                     'top': scol_top,
                                     'left': rtColumn.offset().left + rtColumn.outerWidth() });
        if (event_or_callback instanceof Function) {
            event_or_callback.call(jQuery('#scrollColumn')[0]);
        }
    };

    var show_document_response = function (doctype, docid, match_id, document_response) {
        var title = document_response['title'];
        if (title != null) {
            $("#match-title").text(title);
        } 
        var url = document_response['url'];
        if (url != null) {
            $("div#rtColumn").find('h3.withTip').html('<a href="' + url + '">' + title + '</a>');

        } 
//        else {
  //          $("a#match-url").text(title);
       // }
  
        var dateline = document_response['date']
        if (dateline != null && dateline != '') {
            if (typeof dateline == 'number') {
                dateline = (new Date(dateline)).toDateString();
            }
            $('div#rtColumn').find('time').attr('datetime', dateline);
            $('div#rtColumn').find('time').attr('pubdate', dateline);
            dateline = document_response['source'] + ' | ' + dateline.substring(5,7) + '/' + dateline.substring(8,10) + '/' + dateline.substring(0,4);
        
            $('div#rtColumn').find('time').text(dateline);
        }
    
        if (match_id != null){
            if ($("ol#matches li.active").hasClass('confirmed') == false ){    
                $("#confirm").find('a#btnConfirm').attr('href', '/sidebyside/confirmed/'+ match_id + '/').css('background-image', 'url(/static/images/btn_confirm.png)').end().show();
            } else {
                $("#confirm").find('a#btnConfirm').attr('href', '/sidebyside/confirmed/'+ match_id + '/').css('background-image', 'url(/static/images/btn_thanks.png)').end().show();
            }
        }

        textdiv = match_text_el(doctype, docid);
        textdiv.html(document_response['text']);
        with_search_row(doctype, docid, function(row){
            $.each(row['snippets'], function(idx, snippet){
                var sub_snippets = snippet.split(/[\r\n]+/g).map(function(ss){ return ss.trim(); });
                $.each(sub_snippets, function(idx, sub_snippet){
                    if (sub_snippet.length > 0) {
                        highlight_match(match_text_el(doctype, docid), sub_snippet);
                    }
                });
            });
        });
        textdiv.html(markup_text(textdiv.html()));

        show_thumbnail(textdiv);
    };

    var show_thumbnail = function (textdiv) {
        var aspect_ratio = textdiv.height() / textdiv.width();
        var options = {
            logging: true,
            renderer: 'canvas',
            elements: textdiv[0]
        };
        options.complete = function (images) {
            var parsed = html2canvas.Parse(textdiv[0], images, options);
            var canvas = html2canvas.Renderer(parsed, options);
            var scaled_dimensions = {
                width: 190,
                height: 190 * aspect_ratio
            };
            var scaled_dimensions = {
                width: 140,
                height: Math.min(140 * aspect_ratio,
                                 jQuery(window).height() - jQuery('#match-title').offset().top)
            };
            var offset = textdiv.offset();

            var new_canvas = jQuery('<canvas>').attr('width', scaled_dimensions.width).attr('height', scaled_dimensions.height)[0];
            var new_ctx = new_canvas.getContext('2d');
            new_ctx.drawImage(canvas,
                offset.left, offset.top, textdiv.width(), textdiv.height(),
                0, 0, scaled_dimensions.width, scaled_dimensions.height
            );
            Filters.filterCanvas(new_canvas, Filters.lineify, [0.7]);
            var li = match_listitem_el(doctype, docid);
            jQuery('<img>').attr('src', new_canvas.toDataURL()).appendTo('#scrollColumn').click(function(click){
                var y = click.pageY - jQuery(this).offset().top;
                var pct = y / jQuery(this).height();
                var scroll_target = textdiv.outerHeight() * pct;
                jQuery('html, body').animate({scrollTop: scroll_target}, {duration: 900});
            });
            set_scroll_column_position(function(){
                jQuery('#scrollColumn').show();
            });
            jQuery(window).scroll(set_scroll_column_position);
            jQuery(window).resize(set_scroll_column_position);
        };
        html2canvas.Preload(textdiv[0], options);
    };

    var select_document = function (doctype, docid, match_id) {
        jQuery('#scrollColumn').empty().hide();
        fetch_document(doctype, docid, match_id, show_document_response);
        selected = {
            'doctype': doctype,
            'docid': docid,
            'matchid': match_id,
        };
    };

    var select_document_tab = function (doctype, docid) {
        var li = match_listitem_el(doctype, docid);

        $(li).siblings().removeClass("active");
        $(li).toggleClass('active');

        $(li).siblings().find('span.scissorTop').addClass("hidden");
        $(li).siblings().find('span.scissorBottom').addClass("hidden");

        $(li).find('span.scissorTop').removeClass("hidden");
        $(li).find('span.scissorBottom').removeClass("hidden");

        var permalink = $('.permalink', li).attr('href');
        $("#share-page-url").attr('value', permalink);
    };

    var build_text_idstr = function (doctype, docid) {
        return 'match-text-DOCTYPE-DOCID'.replace('DOCTYPE', doctype).replace('DOCID', docid);
    };

    var build_listitem_idstr = function (doctype, docid) {
        return 'match-title-DOCTYPE-DOCID'.replace('DOCTYPE', doctype).replace('DOCID', docid);
    };

    var match_listitem_el = function (doctype, docid) {
        return $('li#' + build_listitem_idstr(doctype, docid));
    };

    var match_text_el = function (doctype, docid) {
        return $('div#match-text')
    };

    var extract_document_attrs = function (idstr) {
        var pattern = /match-(title|text)-(\d+)-(\d+)/;
        var matches = pattern.exec(idstr);
        if (matches.length == 4) {
            return { doctype: matches[2], docid: matches[3] };
        } else {
            return null;
        }
    };

    $('span.url-problem a').click(function(click){
        var that = this;
        $.get('/sidebyside/urlproblem/', { 'brokenurl': that.href , }, 
            function(data, textStatus){ window.location.href = '/?brokenurl=true'} );
        return false; 
    });

    $("ol#matches li a.sidebyside-link").click(function(click){
        click.stopPropagation();
    });

    $("ol#matches li").click(function(click){

        if ($(this).hasClass("active") == false) {
            var match_id = $(click.currentTarget).attr('match');
            var idstr = $(click.currentTarget).attr('id');
            var docattrs = extract_document_attrs(idstr);
            if (docattrs) {
                select_document_tab(docattrs['doctype'], docattrs['docid']);
                select_document(docattrs['doctype'], docattrs['docid'], match_id);
            }
        }

        return false;
    });

    var permalink_matches = permalink_pattern.exec(window.location.pathname);
    if ((permalink_matches != null) && (permalink_matches.length == 4)) {
        var doctype = permalink_matches[2];
        var docid = permalink_matches[3];
        select_document_tab(doctype, docid);
        select_document(doctype, docid, null);
    } else {
        $("#matches li:first").trigger('click');
    }

    sourcediv = $("div#source-text");

    $('body').scroll(function(event){
        event.preventDefault();
    });

     $("#btnConfirm").click(function(){
        if ($('ol#matches li.active').hasClass('confirmed') == false) {
            var that = this
            $.get( $(that).attr('href'), {
                crossDomain: false,
                cache: false,
            }).success(function(resp){
                $("ol#matches li.active").addClass('confirmed');
                $(that).css('background-image', 'url(/static/images/btn_thanks.png)');
            });
        }
        return false; 
      });
});

