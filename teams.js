//MS Teams Helper by rdbo

//Global variables

var tms_cancel = false;

//Functions

function sleep(ms)
{
    return new Promise(resolve => setTimeout(resolve, ms));
}

function time_to_secs(time_str)
{
    time_list = time_str.split(":");
    time_list = time_list.reverse();

    secs = 0;

    if(time_list.length == 0)
        time_list[0] = time_str;

    for(i = 0; i < time_list.length; i++)
    {
        cur_number = Number(time_list[i]);
        if(cur_number === NaN)
        {
            secs = -1;
            break;
        }

        if(i < 3) //minutes, seconds, hours
        {
            secs += Number(time_list[i]) * (60 ** i);
        }

        else if(i == 3) //days
        {
            secs += Number(time_list[i]) * 24 * (60 ** 2);
        }

        else if(i == 4) //monthes (30 days each)
        {
            secs += Number(time_list[i]) * 30 * 24 * (60 ** 2);
        }

        else if(i > 4) //years, decades, centuries...
        {
            secs += Number(time_list[i]) * (10 ** (i - 5)) * 365 * 24 * (60 ** 2);
        }
    }

    return secs;
}

function tms_get_call_time()
{
    duration = document.getElementById("calling-duration");
    elements = duration.getElementsByClassName("badge-text");
    time_left = ""
    time_left_html = '<div class="badge-text" ng-if="::handler.showBadge">';

    for(i = 0; i < elements.length; i++)
    {
        if(elements[i].outerHTML.startsWith(time_left_html))
            time_left = elements[i].textContent;
    }

    return time_left;
}

<!--
function tms_get_member_count()
{
    elements = document.getElementsByTagName("accordion-section");
    html_filter = '<accordion-section sid="'
    member_count = 0

    for(i = 0; i < elements.length; i++)
    {
        if(elements[i].outerHTML.startsWith(html_filter))
        {
            elements2 = elements[i].getElementsByClassName("roster-list-title");
            for(j = 0; j < elements2.length; j++)
            {
                elements3 = elements2[j].getElementsByClassName("toggle-number");
                member_count += Number(elements3[0].innerText.substr(1, elements3[0].innerText.length - 2));
            }

            break;
        }
    }

    return member_count;
}
-->

function tms_get_member_count()
{
    elements = document.getElementsByTagName("button");
    html_filter = '<button accordion-section-toggle="" class="roster-list-title" aria-label="';
    member_count = 0;

    for(i = 0; i < elements.length - 1; i++)
    {
        if(elements[i].outerHTML.startsWith(html_filter))
        {
            numbers = elements[i].getElementsByClassName("toggle-number");
            count_str = numbers[0].innerText;
            member_count += Number(count_str.substr(1, count_str.length - 2));
        }
    }

    return member_count;
}

function tms_hangup()
{
    btn_hangup = document.getElementById("hangup-button");
    btn_hangup.click();
}

async function tms_callback(callback, args, delay)
{
    while(await callback(args))
    {
        await sleep(delay);
    }

    return true;
}


function tms_load_member_count()
{
    //This must be called at least once before tms_get_member_count

    btn_participants = document.getElementById("roster-button");
    btn_participants.click(); //Load member count (participant button)
    btn_participants.click(); //Toggle participants panel back
}

async function tms_hangup_on_member_count(member_num)
{
    await tms_load_member_count();
    await tms_callback((member_count_hangup) => {
        member_count = tms_get_member_count();

        if(member_count == NaN || Number(member_count_hangup) == NaN || tms_cancel == true)
            return false;

        if(member_count <= member_count_hangup)
        {
            tms_hangup();
            return false;
        }

        return true;
    }, member_num, 1000);
}

async function tms_hangup_on_system_time(system_time_str)
{
    await tms_callback((hangup_time_str) => {
        system_time = new Date();
        system_time_str = system_time.getHours() + ":" + system_time.getMinutes() + ":" + system_time.getSeconds();

        max_time = time_to_secs("23:59:59");
        cur_time = time_to_secs(system_time_str);
        hangup_time = time_to_secs(hangup_time_str);

        if(cur_time == NaN || hangup_time == NaN || hangup_time > max_time || tms_cancel == true)
            return false;

        if(cur_time >= hangup_time)
        {
            tms_hangup();
            return false;
        }

        return true;
    }, system_time_str, 1000);
}

async function tms_hangup_on_call_time(hangup_time_str)
{
    await tms_callback((hangup_time_str) => {
        call_time_str = tms_get_call_time();
        call_time = time_to_secs(call_time_str);
        hangup_time = time_to_secs(hangup_time_str);

        if(call_time == -1 || hangup_time == -1 || tms_cancel == true)
            return false;

        if(call_time >= hangup_time)
        {
            tms_hangup();
            return false;
        }

        return true;
    }, hangup_time_str, 1000);
}