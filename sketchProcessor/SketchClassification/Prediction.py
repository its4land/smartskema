class Predicton:
    def __init__(self, boundingBox, prediction, label):
        self.bBox = boundingBox
        self.p = prediction
        self.l = label
        (x1, y1, x2, y2) = boundingBox
        self.c = (int((x2 + x1)/2), int((y2 + y1)/2) )
        colors = {'Background' :  (0, 0, 0),
         'Boma' :  (0, 0, 255),
         'House' : (92, 92, 205),
         'Marsh' : (255, 0, 0),
         'Mountain' : (0, 255, 0),
         'Olopololi' : (139, 0, 139),
         'Oltinka' : (211, 0, 148),
         'River' : (0, 0, 255),
         'School' : (208,96,255),
         'Tree' : (0,192,0),
         'Triangle' : (16,160,255),
         'WaterTank': (0,255,255),
         '': (255,255,255)  }
        if (self.l in colors):
            self.color = colors[self.l]
        else:
            self.color = (0,0,0)
    def __str__(self):
        return 'id : ' + str(id)  + ' centroid : ' + str(self.c) + ' label : ' + str(self.l) + ' probability : ' + str(round(self.p, 3))

