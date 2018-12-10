

from django.contrib.gis.db import models

class Cabu(models.Model):
    gid = models.AutoField(primary_key=True)
    recid = models.IntegerField(blank=True, null=True)
    type = models.CharField(max_length=2, blank=True, null=True)
    the_geom = models.GeometryField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'cabu'


class Canu(models.Model):
    gid = models.AutoField(primary_key=True)
    canuan = models.FloatField(blank=True, null=True)
    canutx = models.CharField(max_length=11, blank=True, null=True)
    sheet = models.CharField(max_length=18, blank=True, null=True)
    the_geom = models.GeometryField(blank=True, null=True)
    numpolice = models.CharField(max_length=15, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'canu'


class Capa(models.Model):
    gid = models.AutoField(primary_key=True)
    capakey = models.CharField(max_length=17)
    casekey = models.CharField(max_length=6, blank=True, null=True)
    the_geom = models.GeometryField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'capa'


class GlobalNatures(models.Model):
    nature_pk = models.IntegerField(primary_key=True)
    nature_fr = models.CharField(max_length=44, blank=True, null=True)
    nature_ge = models.CharField(max_length=44, blank=True, null=True)
    nature_nl = models.CharField(max_length=44, blank=True, null=True)
    obsolete = models.BooleanField()

    class Meta:
        managed = False
        db_table = 'global_natures'


class Inli(models.Model):
    gid = models.AutoField(primary_key=True)
    inlity = models.CharField(max_length=2, blank=True, null=True)
    inlitx = models.CharField(max_length=50, blank=True, null=True)
    sheet = models.CharField(max_length=18, blank=True, null=True)
    the_geom = models.GeometryField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'inli'


class Inpt(models.Model):
    gid = models.AutoField(primary_key=True)
    inptty = models.CharField(max_length=2, blank=True, null=True)
    inpttx = models.CharField(max_length=50, blank=True, null=True)
    sheet = models.CharField(max_length=18, blank=True, null=True)
    the_geom = models.GeometryField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'inpt'


class Parcelsstreets(models.Model):
    street_uid = models.AutoField(primary_key=True)
    niscom = models.BigIntegerField(blank=True, null=True)
    street_situation = models.CharField(max_length=200, blank=True, null=True)
    street_translation = models.CharField(max_length=200, blank=True, null=True)
    street_code = models.BigIntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'parcelsstreets'

class Parcels(models.Model):
    propertysituationid = models.BigIntegerField(primary_key=True)
    mukey = models.BigIntegerField(blank=True, null=True)
    divcad = models.BigIntegerField(blank=True, null=True)
    section = models.CharField(max_length=2, blank=True, null=True)
    primarynumber = models.IntegerField(blank=True, null=True)
    bisnumber = models.CharField(max_length=6, blank=True, null=True)
    exponentletter = models.CharField(max_length=2, blank=True, null=True)
    exponentnumber = models.CharField(max_length=6, blank=True, null=True)
    partnumber = models.CharField(max_length=10, blank=True, null=True)
    capakey = models.ForeignKey(Capa, on_delete=models.CASCADE)
    nature = models.IntegerField(blank=True, null=True)
    descriptprivate = models.CharField(max_length=100, blank=True, null=True)
    block = models.CharField(max_length=20, blank=True, null=True)
    floor = models.CharField(max_length=20, blank=True, null=True)
    floorsituation = models.CharField(max_length=60, blank=True, null=True)
    crossdetail = models.CharField(max_length=60, blank=True, null=True)
    matutil = models.CharField(max_length=60, blank=True, null=True)
    nottaxedmatutil = models.CharField(max_length=10, blank=True, null=True)
    niscom = models.BigIntegerField(blank=True, null=True)
    street_uid = models.ForeignKey(Parcelsstreets, on_delete=models.CASCADE)
    number = models.CharField(max_length=20, blank=True, null=True)
    datesituation = models.DateField(blank=True, null=True)
    group_uid = models.BigIntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'parcels'

class Ownersnames(models.Model):
    owner_uid = models.AutoField(primary_key=True)
    officialid = models.CharField(max_length=30, blank=True, null=True)
    name = models.CharField(max_length=400, blank=True, null=True)
    firstname = models.CharField(max_length=180, blank=True, null=True)
    birthdate = models.DateField(blank=True, null=True)
    country = models.CharField(max_length=4, blank=True, null=True)
    zipcode = models.CharField(max_length=30, blank=True, null=True)
    municipality_fr = models.CharField(max_length=100, blank=True, null=True)
    municipality_nl = models.CharField(max_length=100, blank=True, null=True)
    street_fr = models.CharField(max_length=300, blank=True, null=True)
    street_nl = models.CharField(max_length=300, blank=True, null=True)
    number = models.CharField(max_length=20, blank=True, null=True)
    boxnumber = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'ownersnames'


class Ownersproperties(models.Model):
    situation_uid = models.AutoField(primary_key=True)
    group_uid = models.BigIntegerField(blank=True, null=True)
    propertysituationid = models.ForeignKey(Parcels, on_delete=models.CASCADE)
    order = models.IntegerField(blank=True, null=True)
    partytype = models.IntegerField(blank=True, null=True)
    ownerright = models.CharField(max_length=120, blank=True, null=True)
    right_trad = models.CharField(max_length=102, blank=True, null=True)
    managedby = models.CharField(max_length=4, blank=True, null=True)
    owner_uid = models.ForeignKey(Ownersnames, on_delete=models.CASCADE, related_name="owner")
    partner_uid = models.ForeignKey(Ownersnames, on_delete=models.CASCADE, related_name="partner")
    coowner = models.CharField(max_length=120, blank=True, null=True)
    anonymousowner = models.CharField(max_length=120, blank=True, null=True)
    datesituation = models.DateField(blank=True, null=True)
    divcad = models.BigIntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'ownersproperties'


class ParcelsCc(models.Model):
    parcels_cc_pk = models.AutoField(primary_key=True)
    propertysituationid = models.ForeignKey(Parcels, on_delete=models.CASCADE)
    constructionindication = models.IntegerField(blank=True, null=True)
    constructiontype = models.CharField(max_length=40, blank=True, null=True)
    constructionyear = models.CharField(max_length=8, blank=True, null=True)
    floornumberaboveground = models.CharField(max_length=510, blank=True, null=True)
    garret = models.CharField(max_length=2, blank=True, null=True)
    physmodyear = models.CharField(max_length=8, blank=True, null=True)
    constructionquality = models.CharField(max_length=2, blank=True, null=True)
    garagenumber = models.IntegerField(blank=True, null=True)
    centralheating = models.CharField(max_length=2, blank=True, null=True)
    bathroomnumber = models.IntegerField(blank=True, null=True)
    housingunitnumber = models.IntegerField(blank=True, null=True)
    placenumber = models.IntegerField(blank=True, null=True)
    builtsurface = models.BigIntegerField(blank=True, null=True)
    usedsurface = models.BigIntegerField(blank=True, null=True)
    cc = models.CharField(max_length=110, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'parcels_cc'

class ParcelsRc(models.Model):
    parcels_rc_pk = models.BigIntegerField(primary_key=True)
    propertysituationid = models.ForeignKey(Parcels, on_delete=models.CASCADE)
    order = models.IntegerField(blank=True, null=True)
    polwa = models.CharField(max_length=20, blank=True, null=True)
    surfacenottaxable = models.BigIntegerField(blank=True, null=True)
    surfacetaxable = models.BigIntegerField(blank=True, null=True)
    surfaceverif = models.CharField(max_length=2, blank=True, null=True)
    soilindex = models.BigIntegerField(blank=True, null=True)
    soilrent = models.CharField(max_length=10, blank=True, null=True)
    cadastralincomepersurface = models.BigIntegerField(blank=True, null=True)
    cadastralincomepersurfaceotherdi = models.BigIntegerField(blank=True, null=True)
    numbercadastralincome = models.BigIntegerField(blank=True, null=True)
    charcadastralincome = models.CharField(max_length=4, blank=True, null=True)
    cadastralincome = models.BigIntegerField(blank=True, null=True)
    dateendexoneration = models.DateField(blank=True, null=True)
    decrete = models.CharField(max_length=40, blank=True, null=True)
    datesituation = models.DateField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'parcels_rc'


class OwnersImp(models.Model):
    propertysituationidf = models.BigIntegerField(blank=True, null=True)
    order = models.IntegerField(blank=True, null=True)
    partytype = models.IntegerField(blank=True, null=True)
    ownerright = models.CharField(max_length=120, blank=True, null=True)
    right_trad = models.CharField(max_length=102, blank=True, null=True)
    managedby = models.CharField(max_length=4, blank=True, null=True)
    owner_officialid = models.CharField(max_length=30, blank=True, null=True)
    owner_name = models.CharField(max_length=400, blank=True, null=True)
    owner_firstname = models.CharField(max_length=180, blank=True, null=True)
    owner_birthdate = models.DateField(blank=True, null=True)
    owner_country = models.CharField(max_length=4, blank=True, null=True)
    owner_zipcode = models.CharField(max_length=30, blank=True, null=True)
    owner_municipality_fr = models.CharField(max_length=100, blank=True, null=True)
    owner_municipality_nl = models.CharField(max_length=100, blank=True, null=True)
    owner_street_fr = models.CharField(max_length=300, blank=True, null=True)
    owner_street_nl = models.CharField(max_length=300, blank=True, null=True)
    owner_number = models.CharField(max_length=20, blank=True, null=True)
    owner_boxnumber = models.CharField(max_length=20, blank=True, null=True)
    partner_officialid = models.CharField(max_length=30, blank=True, null=True)
    partner_name = models.CharField(max_length=400, blank=True, null=True)
    partner_firstname = models.CharField(max_length=180, blank=True, null=True)
    partner_birthdate = models.DateField(blank=True, null=True)
    partner_country = models.CharField(max_length=4, blank=True, null=True)
    partner_zipcode = models.CharField(max_length=30, blank=True, null=True)
    partner_municipality_fr = models.CharField(max_length=100, blank=True, null=True)
    partner_municipality_nl = models.CharField(max_length=100, blank=True, null=True)
    partner_street_fr = models.CharField(max_length=300, blank=True, null=True)
    partner_street_nl = models.CharField(max_length=300, blank=True, null=True)
    partner_number = models.CharField(max_length=20, blank=True, null=True)
    partner_boxnumber = models.CharField(max_length=20, blank=True, null=True)
    coowner = models.CharField(max_length=120, blank=True, null=True)
    anonymousowner = models.CharField(max_length=120, blank=True, null=True)
    datesituation = models.DateField(blank=True, null=True)
    divcad = models.BigIntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'owners_imp'


class ParcelsImp(models.Model):
    propertysituationidf = models.BigIntegerField(blank=True, null=True)
    divcad = models.BigIntegerField(blank=True, null=True)
    section = models.CharField(max_length=2, blank=True, null=True)
    primarynumber = models.IntegerField(blank=True, null=True)
    bisnumber = models.CharField(max_length=6, blank=True, null=True)
    exponentletter = models.CharField(max_length=2, blank=True, null=True)
    exponentnumber = models.CharField(max_length=6, blank=True, null=True)
    partnumber = models.CharField(max_length=10, blank=True, null=True)
    capakey = models.CharField(max_length=34, blank=True, null=True)
    order = models.IntegerField(blank=True, null=True)
    nature = models.IntegerField(blank=True, null=True)
    descriptprivate = models.CharField(max_length=100, blank=True, null=True)
    block = models.CharField(max_length=20, blank=True, null=True)
    floor = models.CharField(max_length=20, blank=True, null=True)
    floorsituation = models.CharField(max_length=60, blank=True, null=True)
    crossdetail = models.CharField(max_length=60, blank=True, null=True)
    matutil = models.CharField(max_length=60, blank=True, null=True)
    nottaxedmatutil = models.CharField(max_length=10, blank=True, null=True)
    niscom = models.BigIntegerField(blank=True, null=True)
    street_situation = models.CharField(max_length=200, blank=True, null=True)
    street_translation = models.CharField(max_length=200, blank=True, null=True)
    street_code = models.BigIntegerField(blank=True, null=True)
    number = models.CharField(max_length=20, blank=True, null=True)
    polwa = models.CharField(max_length=20, blank=True, null=True)
    surfacenottaxable = models.BigIntegerField(blank=True, null=True)
    surfacetaxable = models.BigIntegerField(blank=True, null=True)
    surfaceverif = models.CharField(max_length=2, blank=True, null=True)
    constructionyear = models.CharField(max_length=8, blank=True, null=True)
    soilindex = models.BigIntegerField(blank=True, null=True)
    soilrent = models.CharField(max_length=10, blank=True, null=True)
    cadastralincomepersurface = models.BigIntegerField(blank=True, null=True)
    cadastralincomepersurfaceotherdi = models.BigIntegerField(blank=True, null=True)
    numbercadastralincome = models.BigIntegerField(blank=True, null=True)
    charcadastralincome = models.CharField(max_length=4, blank=True, null=True)
    cadastralincome = models.BigIntegerField(blank=True, null=True)
    dateendexoneration = models.DateField(blank=True, null=True)
    decrete = models.CharField(max_length=40, blank=True, null=True)
    constructionindication = models.IntegerField(blank=True, null=True)
    constructiontype = models.CharField(max_length=40, blank=True, null=True)
    floornumberaboveground = models.CharField(max_length=510, blank=True, null=True)
    garret = models.CharField(max_length=2, blank=True, null=True)
    physmodyear = models.CharField(max_length=8, blank=True, null=True)
    constructionquality = models.CharField(max_length=2, blank=True, null=True)
    garagenumber = models.IntegerField(blank=True, null=True)
    centralheating = models.CharField(max_length=2, blank=True, null=True)
    bathroomnumber = models.IntegerField(blank=True, null=True)
    housingunitnumber = models.IntegerField(blank=True, null=True)
    placenumber = models.IntegerField(blank=True, null=True)
    builtsurface = models.BigIntegerField(blank=True, null=True)
    usedsurface = models.BigIntegerField(blank=True, null=True)
    datesituation = models.DateField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'parcels_imp'