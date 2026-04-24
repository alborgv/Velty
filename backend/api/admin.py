from django.contrib import admin
from .models import *

admin.site.register(Borrower)
admin.site.register(Loans)
admin.site.register(Installment)