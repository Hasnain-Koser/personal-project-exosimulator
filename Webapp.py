import flask as fl
import pickle
import sqlite3
import json
import random
import numpy as np
import pandas as pd
from bokeh.models import ColumnDataSource, HoverTool, Range1d
from bokeh.plotting import figure
from bokeh.embed import components
from bokeh.resources import CDN
from bokeh.palettes import Category10_10

app = fl.Flask(__name__)


def plthistgraph(colname, column, bins, x_range):
    conn = sqlite3.connect("ExoplanetData.db")

    cur = conn.cursor()

    cur.execute("SELECT " + column + " FROM ExoplanetsFull WHERE " + column + " IS NOT NULL")
    results = cur.fetchall()
    coldata = []
    for result in results:
        result = float(result[0])
        coldata.append(result)
    conn.commit()
    conn.close()
    x = coldata

    # build histogram data with Numpy
    hist, edges = np.histogram(x, bins=bins)
    hist_df = pd.DataFrame({column: hist, "left": edges[:-1], "right": edges[1:]})
    hist_df["interval"] = ["%.3f to %.3f" % (left, right) for left, right in zip(hist_df["left"], hist_df["right"])]
    # bokeh histogram with hover tool
    src = ColumnDataSource(hist_df)
    plot = figure(sizing_mode="scale_both", aspect_ratio=1.7, title="Histogram of {}".format(colname.capitalize()),
                  x_axis_label=colname.capitalize(), y_axis_label="Count")
    plot.quad(bottom=0, top=column, left="left", right="right", source=src, fill_color="blue", line_color="black",
              fill_alpha=0.7, hover_fill_alpha=1.0, hover_fill_color="#00b300")
    if x_range[0] and x_range[1]:
        plot.x_range = Range1d(x_range[0], x_range[1])
    # hover tool
    hover = HoverTool(tooltips=[('Interval', '@interval'),
                                ('Count', str("@" + column))])
    plot.add_tools(hover)

    script, div = components(plot)

    return script, div


def pltspectypebar():
    conn = sqlite3.connect("ExoplanetData.db")

    cur = conn.cursor()

    methods = [("%M%",), ("%K%",), ("%G%",), ("%F%",), ("%A%",), ("%B%",), ("%O%",), ("%WD%",)]
    spectypes = ["M", "K", "G", "F", "A", "B", "O", "WD"]
    count = []

    for method in methods:
        cur.execute("SELECT COUNT(st_spectype) FROM ExoplanetsFull WHERE st_spectype LIKE ?", method)
        results = cur.fetchall()
        result = int(results[0][0])
        count.append(result)
    conn.commit()
    conn.close()

    color_palette = ["#ff4500", "#FF971A", "#FFD300", "#FCF4A3", "#FFFFFF", "#CDEDFA", "#0C71E0", "#FFFFFF"]

    p1 = figure(y_range=spectypes, sizing_mode="scale_both", aspect_ratio=1.7, title="Stellar Spectral Types")
    p1.hbar(y=spectypes, left=0, right=count, height=.9, color=color_palette, line_color='white', line_alpha=.5)
    p1.background_fill_color = "#333333"

    script, div = components(p1)

    return script, div


def pltdiscmethodbar():
    conn = sqlite3.connect("ExoplanetData.db")

    cur = conn.cursor()

    methods = ["rv", "pul", "ptv", "tran", "ast", "obm", "micro", "etv", "ima", "dkin"]
    metnames = ["Radial Velocity", "Pulsar Timing Variations", "Pulsation Timing Variations", "Transit",
                "Astrometric Variation", "Orbital Brightness Modulation", "Microlensing", "Eclipse Timing Variations",
                "Imaging", "Disc Kinematics"]
    count = []

    for method in methods:
        cur.execute("SELECT COUNT(" + method + "_flag) FROM ExoplanetsFull WHERE " + method + "_flag LIKE 1")
        results = cur.fetchall()
        result = int(results[0][0])
        count.append(result)
    conn.commit()
    conn.close()

    p1 = figure(y_range=metnames, sizing_mode="scale_both", aspect_ratio=1.7, title="Detection Methods")
    p1.hbar(y=metnames, left=0, right=count, height=.9, color=Category10_10, line_color='white', line_alpha=.5)
    p1.background_fill_color = "#333333"

    script, div = components(p1)

    return script, div


def plmtrtm(model1, model2):

    conn = sqlite3.connect("ExoplanetData.db")

    cur = conn.cursor()

    cur.execute("SELECT pl_rade, pl_bmasse FROM ExoplanetsFull WHERE pl_rade IS NOT NULL AND pl_bmasse IS "
                "NOT NULL AND pl_rade < 13 AND pl_bmasse < 1000")
    results = cur.fetchall()
    g1data = []
    for result in results:
        g1data.append([result[1], result[0]])
    g1data = np.array(g1data)
    conn.commit()
    conn.close()

    g1x = g1data[:, 0]
    g1y = g1data[:, 1]
    g2x = g1y
    g2y = g1x

    g1linex = np.linspace(0, 2000)
    g2linex = np.linspace(0, 13)

    g1liney = model1(g1linex)
    g2liney = model2(g2linex)

    f = figure(title="Planetary Mass to Radius", sizing_mode="scale_both")
    f.circle(g1x, g1y)
    f.line(g1linex, g1liney)

    f2 = figure(title="Planetary Radius to Mass", sizing_mode="scale_both")
    f2.circle(g2x, g2y)
    f2.line(g2linex, g2liney)


    div1, script1 = components(f)
    div2, script2 = components(f2)
    return div1, script1, div2, script2




def stmtrtm(model1, model2):

    conn = sqlite3.connect("ExoplanetData.db")

    cur = conn.cursor()

    cur.execute("SELECT st_rad, st_mass FROM ExoplanetsFull WHERE st_rad IS NOT NULL AND st_mass IS NOT NULL")
    results = cur.fetchall()
    g1data = []
    for result in results:
        g1data.append([result[1], result[0]])
    g1data = np.array(g1data)
    conn.commit()
    conn.close()

    g1x = g1data[:, 0]
    g1y = g1data[:, 1]
    g2x = g1y
    g2y = g1x

    g1linex = np.linspace(0, 12)
    g2linex = np.linspace(0, 80)

    g1liney = model1(g1linex)
    g2liney = model2(g2linex)

    f = figure(title="Stellar Mass to Radius", sizing_mode="scale_both")
    f.circle(g1x, g1y)
    f.line(g1linex, g1liney)

    f2 = figure(title="Stellar Radius to Mass", sizing_mode="scale_both")
    f2.circle(g2x, g2y)
    f2.line(g2linex, g2liney)


    div1, script1 = components(f)
    div2, script2 = components(f2)
    return div1, script1, div2, script2


def mettoplnum(model):
    def segregate(input_list):
        lists = input_list
        mydict = {}
        for l in lists:
            try:
                if l[1] >= mydict[l[0]]:
                    mydict[l[0]] = l[1]
            except KeyError:
                mydict[l[0]] = l[1]
        return mydict
    conn = sqlite3.connect("ExoplanetData.db")

    cur = conn.cursor()

    cur.execute("SELECT st_met, sy_pnum FROM ExoplanetsFull WHERE st_met IS NOT NULL AND sy_pnum IS NOT NULL")
    results = cur.fetchall()
    data = []
    for result in results:
        result = [float(result[0]), float(result[1])]
        data.append(result)
    conn.commit()
    conn.close()
    data = np.array(data)
    data1 = segregate(data)
    x = data[:, 0]
    y = data[:, 1]
    x2 = np.array(list(data1.keys()))
    y2 = np.array(list(data1.values()))

    g1linex = np.linspace(-1, 0.75)

    g1liney = model(g1linex)

    f = figure(title="Metallicity VS Number of Planets", sizing_mode="scale_both")
    f.circle(x, y)

    f2 = figure(title="Regression of Highest planets", sizing_mode="scale_both")
    f2.circle(x2, y2)
    f2.line(g1linex, g1liney)

    div1, script1 = components(f)
    div2, script2 = components(f2)
    return div1, script1, div2, script2

@app.route("/")
def home():
    return fl.render_template("home.html")


@app.route("/about")
def about():
    return fl.render_template("about.html")


@app.route("/simulator")
def simulation():
    return fl.render_template("sim.html")


with open("DataScience Models/solar_mass_to_radius.pkl", "rb") as file:
    model_st_mass_to_rad = pickle.load(file)

with open("DataScience Models/metallicity_to_no_of_planets.pkl", "rb") as file:
    model_met_to_pl = pickle.load(file)

with open("DataScience Models/solar_radius_to_mass.pkl", "rb") as file:
    model_st_rad_to_mass = pickle.load(file)

with open("DataScience Models/radius_to_mass.pkl", "rb") as file:
    model_pl_rad_to_mass = pickle.load(file)

with open("DataScience Models/mass_to_radius.pkl", "rb") as file:
    model_pl_mass_to_rad = pickle.load(file)


@app.route("/data-science")
def data_analysis():
    histcols = {"Planet Mass": 1000, "Planet Radius": 100, "Semi-Major Axes": 1000, "Orbital Period": 1000,
                "Planet Temperature": 100, "Stellar to Orbital Radius Ratio": 100, "Stellar Temperature": 250,
                "Stellar Mass": 100, "Stellar Radius": 250, "Metallicity": 50, "Luminosity": 100,
                "Stellar Gravity": 100, "Stellar Age": 50, "Number Of Planets": 8}
    relcols = {"Planet Mass": "pl_bmasse", "Planet Radius": "pl_rade", "Semi-Major Axes": "pl_orbsmax",
               "Orbital Period": "pl_orbper", "Planet Temperature": "pl_eqt",
               "Stellar to Orbital Radius Ratio": "pl_ratdor", "Stellar Temperature": "st_teff",
               "Stellar Mass": "st_mass", "Stellar Radius": "st_rad", "Metallicity": "st_met", "Luminosity": "st_lum",
               "Stellar Gravity": "st_logg", "Stellar Age": "st_age", "Number Of Planets": "sy_pnum"}
    xmaxcols = {"Planet Mass": 12000, "Planet Radius": 0, "Semi-Major Axes": 100, "Orbital Period": 2e+5,
                "Planet Temperature": 0, "Stellar to Orbital Radius Ratio": 0, "Stellar Temperature": 0,
                "Stellar Mass": 0, "Stellar Radius": 15, "Metallicity": 0, "Luminosity": 0,
                "Stellar Gravity": 0, "Stellar Age": 0, "Stellar Rotational Velocity": 100, "Number Of Planets": 0}
    xmincols = {"Planet Mass": 1000, "Planet Radius": 0, "Semi-Major Axes": 10, "Orbital Period": 2.5e+4,
                "Planet Temperature": 0, "Stellar to Orbital Radius Ratio": 0, "Stellar Temperature": 0,
                "Stellar Mass": 0, "Stellar Radius": 1, "Metallicity": 0, "Luminosity": 0,
                "Stellar Gravity": 0, "Stellar Age": 0, "Number Of Planets": 0}
    scripts = []
    divs = []
    for col in list(histcols.keys()):
        src, div = plthistgraph(col, relcols[col], histcols[col], (-xmincols[col], xmaxcols[col]))
        scripts.append(src)
        divs.append(div)
    CDN_js = CDN.js_files[0]
    src2, div2 = pltspectypebar()
    src3, div3 = pltdiscmethodbar()
    div4, src4, div5, src5 = plmtrtm(model_pl_mass_to_rad, model_pl_rad_to_mass)
    div6, src6, div7, src7 = stmtrtm(model_st_mass_to_rad, model_st_rad_to_mass)
    div8, src8, div9, src9 = mettoplnum(model_met_to_pl)
    return fl.render_template("dataA.html", scripts=scripts, divs=divs, CDN_js=CDN_js, src2=src2, div2=div2, src3=src3,
                              div3=div3, div4=div4, div5=div5, div6=div6, div7=div7, div8=div8, div9=div9, src4=src4,
                              src5=src5, src6=src6, src7=src7, src8=src8, src9=src9)


@app.route("/playground")
def playground():
    return fl.render_template("playground.html")


@app.route('/data', methods=['GET', 'POST'])
def data():
    # POST request
    if fl.request.method == 'POST':
        query = (fl.request.get_json()["query"],)
        conn = sqlite3.connect("ExoplanetData.db")

        cur = conn.cursor()

        cur.execute(
            "SELECT pl_rade, pl_bmasse, pl_orbsmax, pl_orbeccen, pl_orbincl, pl_name, st_rad, st_mass, st_vsin, "
            "st_spectype, st_lum, pl_radj, st_radv, pl_orbper, hostname, sy_dist FROM ExoplanetsFull WHERE pl_rade IS NOT NULL "
            "AND pl_bmasse IS NOT NULL AND pl_orbsmax IS NOT NULL AND pl_orbeccen IS NOT NULL AND pl_name IS NOT NULL "
            "AND st_rad IS NOT NULL AND st_mass IS NOT NULL AND st_lum IS NOT NULL AND hostname LIKE ?", query)
        results = cur.fetchall()
        planets = []
        if results:
            for result in results:
                if result[3] and result[4]:
                    if result[11]:
                        pl_data = {
                            "radius": float(result[0]),
                            "mass": float(result[1]),
                            "semi_major": float(result[2]) * 214.84,
                            "eccentricity": float(result[3]),
                            "inclination": float(result[4]),
                            "name": result[5],
                            "jrad": float(result[11]),
                            "period": result[13]
                        }
                    else:
                        pl_data = {
                            "radius": float(result[0]),
                            "mass": float(result[1]),
                            "semi_major": float(result[2]) * 214.84,
                            "eccentricity": float(result[3]),
                            "inclination": float(result[4]),
                            "name": result[5],
                            "jrad": result[11],
                            "period": result[13]
                        }
                elif result[3]:
                    if result[11]:
                        pl_data = {
                            "radius": float(result[0]),
                            "mass": float(result[1]),
                            "semi_major": float(result[2]) * 214.84,
                            "eccentricity": float(result[3]),
                            "inclination": result[4],
                            "name": result[5],
                            "jrad": float(result[11]),
                            "period": result[13]
                        }
                    else:
                        pl_data = {"radius": float(result[0]),
                                   "mass": float(result[1]),
                                   "semi_major": float(result[2]) * 214.84,
                                   "eccentricity": float(result[3]),
                                   "inclination": result[4],
                                   "name": result[5],
                                   "jrad": result[11],
                                   "period": result[13]
                                   }
                elif result[4]:
                    if result[11]:
                        pl_data = {"radius": float(result[0]),
                                   "mass": float(result[1]),
                                   "semi_major": float(result[2]) * 214.84,
                                   "eccentricity": result[3],
                                   "inclination": float(result[4]),
                                   "name": result[5],
                                   "jrad": float(result[11]),
                                   "period": result[13]
                                   }
                    else:
                        pl_data = {"radius": float(result[0]),
                                   "mass": float(result[1]),
                                   "semi_major": float(result[2]) * 214.84,
                                   "eccentricity": result[3],
                                   "inclination": float(result[4]),
                                   "name": result[5],
                                   "jrad": result[11],
                                   "period": result[13]
                                   }
                else:
                    if result[11]:
                        pl_data = {"radius": float(result[0]),
                                   "mass": float(result[1]),
                                   "semi_major": float(result[2]) * 214.84,
                                   "eccentricity": result[3],
                                   "inclination": result[4],
                                   "name": result[5],
                                   "jrad": float(result[11]),
                                   "period": result[13]
                                   }
                    else:
                        pl_data = {"radius": float(result[0]),
                                   "mass": float(result[1]),
                                   "semi_major": float(result[2]) * 214.84,
                                   "eccentricity": result[3],
                                   "inclination": result[4],
                                   "name": result[5],
                                   "jrad": float(result[11]),
                                   "period": result[13]
                                   }
                planets.append(pl_data)
            if results[0][8] and results[0][10]:
                if results[0][12]:
                    star = {"radius": float(results[0][6]), "mass": float(results[0][7]) * 333000,
                            "rotationalvel": float(results[0][8]), "spectraltype": results[0][9],
                            "luminosity": float(results[0][10]), "radvel": float(results[0][12]), "name": results[0][14]
                            }
                else:
                    star = {"radius": float(results[0][6]), "mass": float(results[0][7]) * 333000,
                            "rotationalvel": float(results[0][8]), "spectraltype": results[0][9],
                            "luminosity": float(results[0][10]), "radvel": results[0][12], "name": results[0][14]
                            }
            elif results[0][8]:
                if results[0][12]:
                    star = {"radius": float(results[0][6]), "mass": float(results[0][7]) * 333000,
                            "rotationalvel": float(results[0][8]), "spectraltype": results[0][9],
                            "luminosity": results[0][10], "radvel": float(results[0][12]), "name": results[0][14]
                            }
                else:
                    star = {"radius": float(results[0][6]), "mass": float(results[0][7]) * 333000,
                            "rotationalvel": float(results[0][8]), "spectraltype": results[0][9],
                            "luminosity": results[0][10], "radvel": results[0][12], "name": results[0][14]
                            }
            elif results[0][10]:
                if results[0][12]:
                    star = {"radius": float(results[0][6]), "mass": float(results[0][7]) * 333000,
                            "rotationalvel": results[0][8], "spectraltype": results[0][9],
                            "luminosity": float(results[0][10]), "radvel": float(results[0][12]), "name": results[0][14]
                            }
                else:
                    star = {"radius": float(results[0][6]), "mass": float(results[0][7]) * 333000,
                            "rotationalvel": results[0][8], "spectraltype": results[0][9],
                            "luminosity": float(results[0][10]), "radvel": results[0][12], "name": results[0][14]
                            }
            else:
                if results[0][12]:
                    star = {"radius": float(results[0][6]), "mass": float(results[0][7]) * 333000,
                            "rotationalvel": results[0][8], "spectraltype": results[0][9],
                            "luminosity": results[0][10], "radvel": results[0][12], "name": results[0][14]
                            }
                else:
                    star = {"radius": float(results[0][6]), "mass": float(results[0][7]) * 333000,
                            "rotationalvel": results[0][8], "spectraltype": results[0][9],
                            "luminosity": results[0][10], "radvel": results[0][12], "name": results[0][14]
                            }
            star["distance"] = results[0][15]

        conn.commit()

        conn.close()

        try:
            full_data = {"Planets": planets, "Star": star, "message": None}
        except NameError:
            full_data = {"message": "Sorry, system not found or does not have required parameters to simulate"}
        return fl.jsonify(full_data), 200


@app.route('/randomsyst', methods=['GET', 'POST'])
def randomsyst():
    # GET request
    if fl.request.method == 'GET':
        with open('Randomplhosts.txt', 'r') as f:
            hosts = json.load(f)
        selected = random.choice(hosts)
        query = (selected,)
        conn = sqlite3.connect("ExoplanetData.db")

        cur = conn.cursor()

        cur.execute(
            "SELECT pl_rade, pl_bmasse, pl_orbsmax, pl_orbeccen, pl_orbincl, pl_name, st_rad, st_mass, st_vsin, "
            "st_spectype, st_lum, pl_radj, st_radv, pl_orbper, sy_dist FROM ExoplanetsFull WHERE pl_rade IS NOT NULL AND "
            "pl_bmasse IS NOT NULL AND pl_orbsmax IS NOT NULL AND pl_orbeccen IS NOT NULL AND pl_name IS NOT NULL AND "
            "st_rad IS NOT NULL AND st_mass IS NOT NULL AND st_lum IS NOT NULL AND hostname LIKE ?", query)
        results = cur.fetchall()
        planets = []
        if results:
            for result in results:
                if result[3] and result[4]:
                    if result[11]:
                        pl_data = {
                            "radius": float(result[0]),
                            "mass": float(result[1]),
                            "semi_major": float(result[2]) * 214.84,
                            "eccentricity": float(result[3]),
                            "inclination": float(result[4]),
                            "name": result[5],
                            "jrad": float(result[11]),
                            "period": result[13]
                        }
                    else:
                        pl_data = {
                            "radius": float(result[0]),
                            "mass": float(result[1]),
                            "semi_major": float(result[2]) * 214.84,
                            "eccentricity": float(result[3]),
                            "inclination": float(result[4]),
                            "name": result[5],
                            "jrad": result[11],
                            "period": result[13]
                        }
                elif result[3]:
                    if result[11]:
                        pl_data = {
                            "radius": float(result[0]),
                            "mass": float(result[1]),
                            "semi_major": float(result[2]) * 214.84,
                            "eccentricity": float(result[3]),
                            "inclination": result[4],
                            "name": result[5],
                            "jrad": float(result[11]),
                            "period": result[13]
                        }
                    else:
                        pl_data = {"radius": float(result[0]),
                                   "mass": float(result[1]),
                                   "semi_major": float(result[2]) * 214.84,
                                   "eccentricity": float(result[3]),
                                   "inclination": result[4],
                                   "name": result[5],
                                   "jrad": result[11],
                                   "period": result[13]
                                   }
                elif result[4]:
                    if result[11]:
                        pl_data = {"radius": float(result[0]),
                                   "mass": float(result[1]),
                                   "semi_major": float(result[2]) * 214.84,
                                   "eccentricity": result[3],
                                   "inclination": float(result[4]),
                                   "name": result[5],
                                   "jrad": float(result[11]),
                                   "period": result[13]
                                   }
                    else:
                        pl_data = {"radius": float(result[0]),
                                   "mass": float(result[1]),
                                   "semi_major": float(result[2]) * 214.84,
                                   "eccentricity": result[3],
                                   "inclination": float(result[4]),
                                   "name": result[5],
                                   "jrad": result[11],
                                   "period": result[13]
                                   }
                else:
                    if result[11]:
                        pl_data = {"radius": float(result[0]),
                                   "mass": float(result[1]),
                                   "semi_major": float(result[2]) * 214.84,
                                   "eccentricity": result[3],
                                   "inclination": result[4],
                                   "name": result[5],
                                   "jrad": float(result[11]),
                                   "period": result[13]
                                   }
                    else:
                        pl_data = {"radius": float(result[0]),
                                   "mass": float(result[1]),
                                   "semi_major": float(result[2]) * 214.84,
                                   "eccentricity": result[3],
                                   "inclination": result[4],
                                   "name": result[5],
                                   "jrad": float(result[11]),
                                   "period": result[13]
                                   }
                planets.append(pl_data)
            if results[0][8] and results[0][10]:
                if results[0][12]:
                    star = {"radius": float(results[0][6]), "mass": float(results[0][7]) * 333000,
                            "rotationalvel": float(results[0][8]), "spectraltype": results[0][9],
                            "luminosity": float(results[0][10]), "radvel": float(results[0][12]), "name": selected
                            }
                else:
                    star = {"radius": float(results[0][6]), "mass": float(results[0][7]) * 333000,
                            "rotationalvel": float(results[0][8]), "spectraltype": results[0][9],
                            "luminosity": float(results[0][10]), "radvel": results[0][12], "name": selected
                            }
            elif results[0][8]:
                if results[0][12]:
                    star = {"radius": float(results[0][6]), "mass": float(results[0][7]) * 333000,
                            "rotationalvel": float(results[0][8]), "spectraltype": results[0][9],
                            "luminosity": results[0][10], "radvel": float(results[0][12]), "name": selected
                            }
                else:
                    star = {"radius": float(results[0][6]), "mass": float(results[0][7]) * 333000,
                            "rotationalvel": float(results[0][8]), "spectraltype": results[0][9],
                            "luminosity": results[0][10], "radvel": results[0][12], "name": selected
                            }
            elif results[0][10]:
                if results[0][12]:
                    star = {"radius": float(results[0][6]), "mass": float(results[0][7]) * 333000,
                            "rotationalvel": results[0][8], "spectraltype": results[0][9],
                            "luminosity": float(results[0][10]), "radvel": float(results[0][12]), "name": selected
                            }
                else:
                    star = {"radius": float(results[0][6]), "mass": float(results[0][7]) * 333000,
                            "rotationalvel": results[0][8], "spectraltype": results[0][9],
                            "luminosity": float(results[0][10]), "radvel": results[0][12], "name": selected
                            }
            else:
                if results[0][12]:
                    star = {"radius": float(results[0][6]), "mass": float(results[0][7]) * 333000,
                            "rotationalvel": results[0][8], "spectraltype": results[0][9],
                            "luminosity": results[0][10], "radvel": results[0][12], "name": selected
                            }
                else:
                    star = {"radius": float(results[0][6]), "mass": float(results[0][7]) * 333000,
                            "rotationalvel": results[0][8], "spectraltype": results[0][9],
                            "luminosity": results[0][10], "radvel": results[0][12], "name": selected
                            }

            star["distance"] = results[0][14]

        conn.commit()

        conn.close()

        try:
            full_data = {"Planets": planets, "Star": star, "message": None}
        except NameError:
            full_data = {"message": "Sorry, system not found or does not have required parameters to simulate"}
        return fl.jsonify(full_data), 200


@app.route('/mettopl', methods=['GET', 'POST'])
def mettopl():
    # POST request
    if fl.request.method == 'POST':
        metallicity = float(fl.request.get_json()["met"])
        pl_num = int(round(model_met_to_pl(metallicity), 0))
        planets = {"planetno": pl_num}
        return fl.jsonify(planets), 200


@app.route('/plmtrtmconv', methods=['GET', 'POST'])
def plmtrtmconv():
    # POST request
    planets = {}
    if fl.request.method == 'POST':
        if fl.request.get_json()["plmass"]:
            plmass = float(fl.request.get_json()["plmass"])
            plrad = round(model_pl_mass_to_rad(plmass), 2)
            planets["plrad"] = plrad
        else:
            planets["plrad"] = None
        if fl.request.get_json()["plrad"]:
            plrad = float(fl.request.get_json()["plrad"])
            plmass = round(model_pl_rad_to_mass(plrad), 2)
            planets["plmass"] = plmass
        else:
            planets["plmass"] = None
        return fl.jsonify(planets), 200


@app.route('/smaxeccentoplvel', methods=['GET', 'POST'])
def smaxeccentoplvel():
    # POST request
    if fl.request.method == 'POST':
        smax = float(fl.request.get_json()["smax"])
        eccen = float(fl.request.get_json()["eccen"])
        plvel = int(model_pl_rad_to_mass(smax), 2)
        planets = {"planetno": plvel}
        return fl.jsonify(planets), 200


@app.route('/masstorad', methods=['GET', 'POST'])
def masstorad():
    # POST request
    if fl.request.method == 'POST':
        mass = float(fl.request.get_json()["mass"])
        rad = float(model_st_mass_to_rad(mass))
        planets = {"rad": rad}
        return fl.jsonify(planets), 200


@app.route('/radtomass', methods=['GET', 'POST'])
def radtomass():
    # POST request
    if fl.request.method == 'POST':
        rad = float(fl.request.get_json()["radius"])
        mass = float(model_st_rad_to_mass(rad)) * 333000
        planets = {"mass": mass}
        return fl.jsonify(planets), 200


@app.route('/convertval', methods=['GET', 'POST'])
def convertval():
    # POST request
    if fl.request.method == 'POST':
        jsdata = fl.request.get_json()
        planets = {}
        if jsdata["met"]:
            metallicity = float(jsdata["met"])
            pl_num = int(round(model_met_to_pl(metallicity), 0))
            planets["planetno"] = pl_num
        else:
            planets["planetno"] = None
        if jsdata["mass"]:
            mass = float(jsdata["mass"])
            rad = float(model_st_mass_to_rad(mass))
            planets["rad"] = rad
        else:
            planets["rad"] = None
        if jsdata["radius"]:
            rad = float(jsdata["radius"])
            mass = float(model_st_rad_to_mass(rad)) * 333000
            planets["mass"] = mass
        else:
            planets["mass"] = None
        return fl.jsonify(planets), 200


if __name__ == '__main__':
    app.run(debug=True)
