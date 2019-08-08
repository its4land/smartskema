class HandStroke:
    def __init__(self, id, contour, label, color):
        self.centroid = None
        self.id = id
        self.contour = contour
        self.label = label
        self.color = color
        self.distances = []
        self.labels = []
        self.colors = {'Background': (0, 0, 0),
                  'Boma': (0, 0, 255),
                  'House': (92, 92, 205),
                  'Marsh': (255, 0, 0),
                  'Mountain': (0, 255, 0),
                  'Olopololi': (139, 0, 139),
                  'Oltinka': (211, 0, 148),
                  'River': (0, 0, 255),
                  'School': (208, 96, 255),
                  'Tree': (0, 192, 0),
                  'Triangle': (16, 160, 255),
                  'WaterTank': (0, 255, 255),
                  '': (255, 255, 255)}

    def addDistance(self, distance):
        self.distances.append(distance)
    def addLabel (self, label):
        self.labels.append(label)

    def addCentroid(self, centroid):
        self.centroid = centroid

    def resolveLabel(self):
        if (len(self.labels) == 2):
            # If two labels are competing for this object, we choose the closest one
            if (self.distances[0]>self.distances[1]):
                self.label = self.labels[0]
                self.color = self.colors[self.label]
            else:
                self.label = self.labels[1]
                self.color = self.colors[self.label]
        elif (len(self.labels)>2) :
            # If more than two labels are competing for the same object, we choose the most repeated one
            self.label = max(self.labels, key = self.labels.count)
            self.color = self.colors[self.label]
        else:
            self.label = self.label
            self.color = self.colors[self.label]



